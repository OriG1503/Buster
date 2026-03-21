import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../../shared/consts/pg-error-codes.const';
import { FK_FIELD_TO_TABLE, ONE_TO_ONE_FK_FIELDS } from '../../../shared/consts/entity-relation-map.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { ValueConflictRepository } from '../../entities/conflict/value-conflict.repository';
import { ValueConflictService } from '../../entities/conflict/services/value-conflict.service';
import { RelationalConflictDetectionService } from '../../entities/conflict/services/relational-conflict-detection.service';
import { ParserRowMapper } from '../mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';
import { EntityService } from '../types/entity-service.type';
import { FlyingField } from '../types/flying-field.type';
import { ParsedRow } from '../types/parsed-row.type';
import { ProcessResult } from '../types/process-result.type';
import { MappedEntityBase } from '../types/mapped-entity-base.type';

type EntityResult = { count: number; conflictIds: number[]; flyingField: FlyingField | null; totalFields: number };
type RowResult = { conflictCount: number; conflictIds: number[]; flyingFields: FlyingField[]; totalFields: number };

const BATCH_SIZE = 5;

@Injectable()
export class DataProcessorService {
  private readonly _logger = new Logger(DataProcessorService.name);

  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _enricher: ParsedRowEnricher,
    private readonly _conflictService: ValueConflictService,
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _relationalConflictDetectionService: RelationalConflictDetectionService,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  /** Processes parsed rows in parallel batches to stay within the DB connection pool limit. */
  public async process(rows: ParsedRow[], username: string): Promise<ProcessResult> {
    this._logger.log(`Processing ${rows.length} rows in ${Math.ceil(rows.length / BATCH_SIZE)} batches — user: ${username}`);
    const batches = Array.from({ length: Math.ceil(rows.length / BATCH_SIZE) }, (_, b) =>
      rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE),
    );
    const results = await batches.reduce<Promise<RowResult[]>>(
      async (acc, batch, b) => [
        ...(await acc),
        ...(await Promise.all(batch.map((row, i) => this._processRow(row, username, b * BATCH_SIZE + i)))),
      ],
      Promise.resolve([]),
    );

    const conflictCount = results.reduce((sum, r) => sum + r.conflictCount, 0);
    const conflictIds = results.flatMap((r) => r.conflictIds);
    const flyingFields = results.flatMap((r) => r.flyingFields);
    const totalFields = results.reduce((sum, r) => sum + r.totalFields, 0);
    const flyingFieldCount = flyingFields.reduce((sum, f) => sum + f.fields.length, 0);
    const uploadPercentage = totalFields > 0 ? Math.round(((totalFields - flyingFieldCount) / totalFields) * 100) : 100;

    this._logger.log(`Processing done — ${uploadPercentage}% uploaded, ${conflictCount} conflicts detected`);
    return { conflictCount, conflictIds, flyingFields, uploadPercentage };
  }

  /** Processes a single parsed row leaf-first. */
  private async _processRow(row: ParsedRow, username: string, rowIndex: number): Promise<RowResult> {
    const enriched = this._enricher.enrich(row);

    // Level 1 — independent leaves: no FK dependencies on each other
    const [batteryResult, storageResult, ironResult, cardboardResult, sensorResult, saleResult] = await Promise.all([
      this._processEntity(this._mapper.mapBattery(enriched), this._registry.get('batteries'), username, rowIndex),
      this._processEntity(this._mapper.mapStorage(enriched), this._registry.get('storages'), username, rowIndex),
      this._processEntity(this._mapper.mapIron(enriched), this._registry.get('irons'), username, rowIndex),
      this._processEntity(this._mapper.mapCardboard(enriched), this._registry.get('cardboards'), username, rowIndex),
      this._processEntity(this._mapper.mapSensor(enriched), this._registry.get('sensors'), username, rowIndex),
      this._processEntity(this._mapper.mapSale(enriched), this._registry.get('sales'), username, rowIndex),
    ]);

    // Level 2 — Plastic (needs Battery), Wiring (needs Storage): independent of each other
    const [plasticResult, wiringResult] = await Promise.all([
      this._processEntity(this._mapper.mapPlastic(enriched), this._registry.get('plastics'), username, rowIndex),
      this._processEntity(this._mapper.mapWiring(enriched), this._registry.get('wirings'), username, rowIndex),
    ]);

    // Level 3 — Communication (needs Plastic + Iron)
    const commResult = await this._processEntity(this._mapper.mapCommunication(enriched), this._registry.get('communications'), username, rowIndex);

    // Level 4 — Robot (needs Communication, Wiring, Cardboard, Sensor, Sale)
    const robotResult = await this._processEntity(this._mapper.mapRobot(enriched), this._registry.get('robots'), username, rowIndex);

    const results: EntityResult[] = [batteryResult, storageResult, ironResult, cardboardResult, sensorResult, saleResult, plasticResult, wiringResult, commResult, robotResult];

    return {
      conflictCount: results.reduce((sum, r) => sum + r.count, 0),
      conflictIds: results.flatMap((r) => r.conflictIds),
      flyingFields: results.filter((r) => r.flyingField !== null).map((r) => r.flyingField as FlyingField),
      totalFields: results.reduce((sum, r) => sum + r.totalFields, 0),
    };
  }

  /**
   * Orchestrates a single mapped entity: skips nulls, flags flying fields,
   * then delegates to insert or conflict-check depending on whether the record exists.
   */
  private async _processEntity(
    mapped: MappedEntityBase | null,
    service: EntityService<{ id: string }>,
    username: string, rowIndex: number,
  ): Promise<EntityResult> {
    if (!mapped) { return { count: 0, conflictIds: [], flyingField: null, totalFields: 0 }; }

    const mappedRecord = mapped as MappedEntityBase & Record<string, EntityValue>;

    if (!mappedRecord.id) {
      const fields = Object.keys(mappedRecord).filter((k) => k !== 'id' && k !== 'source' && k !== 'notes' && mappedRecord[k] !== null);
      return { count: 0, conflictIds: [], flyingField: fields.length > 0 ? { entity: service.tableName, fields, rowIndex } : null, totalFields: fields.length };
    }

    const { source: incomingSource, notes: incomingNotes, id, ...incomingFields } = mappedRecord;
    const nonNullFieldCount = Object.keys(incomingFields).filter((k) => incomingFields[k] !== null).length;

    const storedRecord = await service.findById(id);

    if (!storedRecord) {
      return this._insertEntity(service, id, incomingFields, incomingSource, incomingNotes, username, nonNullFieldCount);
    }

    return this._updateExistingEntity(service, id, storedRecord, incomingFields, incomingSource, incomingNotes, username, nonNullFieldCount);
  }

  /**
   * Inserts a new entity record.
   * For OneToOne FK fields, checks for TWO_FATHERS before inserting:
   * if another entity already owns the same child, a relational conflict is created
   * and that FK field is nulled out from the insert to avoid a DB unique violation.
   */
  private async _insertEntity(
    service: EntityService<{ id: string }>,
    id: string, incomingFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null,
    username: string, nonNullFieldCount: number,
  ): Promise<EntityResult> {
    const cleanedFields = { ...incomingFields };

    const relationalConflictIds = (
      await Promise.all(
        Object.keys(incomingFields)
          .filter((field) => field.endsWith('Id') && ONE_TO_ONE_FK_FIELDS.has(field) && incomingFields[field] != null)
          .map(async (fkField) => {
            const childId = String(incomingFields[fkField]);
            const existingOwner = await service.findByFkValue(fkField, childId, id);

            if (!existingOwner) { return null; }

            cleanedFields[fkField] = null;
            const childTable = FK_FIELD_TO_TABLE[fkField];
            const childEntity = await this._registry.get(childTable).findById(childId);

            return this._relationalConflictDetectionService.detectTwoFathers(
              childId, childTable,
              childEntity?.source?.[fkField] ?? null,
              childEntity?.notes?.[fkField] ?? null,
              existingOwner.id as string, id,
              service.tableName,
              (existingOwner.source as Record<string, string | null> | null)?.[fkField] ?? null,
              (existingOwner.notes as Record<string, string | null> | null)?.[fkField] ?? null,
              incomingSource, incomingNotes,
              username,
            );
          }),
      )
    ).filter((id): id is number => id !== null);

    try {
      await service.insert({ id, ...cleanedFields }, incomingSource, incomingNotes);
    } catch (error) {
      if (!(error instanceof QueryFailedError) || (error as any).code !== PG_UNIQUE_VIOLATION) { throw error; }
    }

    return { count: relationalConflictIds.length, conflictIds: [], flyingField: null, totalFields: nonNullFieldCount };
  }

  /**
   * Runs conflict detection against the stored record.
   * Value conflicts are created for non-FK fields that differ.
   * TWO_CHILDS relational conflicts are created for FK fields that differ.
   * Gap-fills (stored null → incoming value) are applied for all fields.
   */
  private async _updateExistingEntity(
    service: EntityService<{ id: string }>,
    id: string, storedRecord: BaseEntity,
    incomingFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null,
    username: string, nonNullFieldCount: number,
  ): Promise<EntityResult> {
    const result = this._conflictService.detectConflicts(
      service.tableName, id,
      storedRecord as object as Record<string, EntityValue>,
      storedRecord.source, storedRecord.notes,
      incomingFields, incomingSource, username, incomingNotes,
    );

    let conflictIds: number[] = [];
    if (result.conflictsToCreate.length > 0) {
      await this._valueConflictRepository.insertMany(result.conflictsToCreate, true);
      conflictIds = await this._valueConflictRepository.findOpenIdsByData(
        result.conflictsToCreate.map((c) => ({
          tableName: c.tableName as string,
          entityId: c.entityId as string,
          columnName: c.columnName as string,
          newValue: c.newValue as string,
        })),
      );
    }

    const relationalCount = await this._detectTwoChildsConflicts(service, id, storedRecord, incomingFields, incomingSource, incomingNotes, username);

    if (Object.keys(result.fieldsToUpdate).length > 0) {
      await service.update(id, result.fieldsToUpdate, result.sourceUpdates, storedRecord.source, result.notesUpdates, storedRecord.notes);
    }

    return { count: result.conflictsToCreate.length + relationalCount, conflictIds, flyingField: null, totalFields: nonNullFieldCount };
  }

  /**
   * Checks all FK fields on the stored entity against incoming values.
   * When both stored and incoming values are non-null and differ, creates a TWO_CHILDS relational conflict.
   */
  private async _detectTwoChildsConflicts(
    service: EntityService<{ id: string }>,
    id: string, storedRecord: BaseEntity,
    incomingFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null,
    username: string,
  ): Promise<number> {
    const storedRecord_ = storedRecord as unknown as Record<string, EntityValue>;

    const results = await Promise.all(
      Object.keys(incomingFields)
        .filter((field) => {
          if (!field.endsWith('Id')) { return false; }
          const storedValue = storedRecord_[field];
          const incomingValue = incomingFields[field];
          return storedValue != null && incomingValue != null && storedValue !== incomingValue;
        })
        .map(async (fkField) => {
          const oldRelatedId = String(storedRecord_[fkField]);
          const newRelatedId = String(incomingFields[fkField]);
          const relatedTable = FK_FIELD_TO_TABLE[fkField];

          if (!relatedTable) { return null; }

          return this._relationalConflictDetectionService.detectTwoChilds(
            id, service.tableName,
            storedRecord.source?.[fkField] ?? null,
            storedRecord.notes?.[fkField] ?? null,
            oldRelatedId, newRelatedId, relatedTable,
            storedRecord.source?.[fkField] ?? null,
            storedRecord.notes?.[fkField] ?? null,
            incomingSource, incomingNotes,
            username,
          );
        }),
    );

    return results.filter((conflictId): conflictId is number => conflictId !== null).length;
  }
}
