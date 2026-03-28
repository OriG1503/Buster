import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../../shared/consts/pg-error-codes.const';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { ONE_TO_ONE_FK_FIELDS } from '../../../shared/consts/one-to-one-fk-fields.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { ValueConflictRepository } from '../../entities/conflict/value-conflict.repository';
import { ValueConflictService } from '../../entities/conflict/services/value-conflict.service';
import { RelationalConflictDetectionService } from '../../entities/conflict/services/relational-conflict-detection.service';
import { ParserRowMapper } from '../mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';
import { FlyingField } from '../types/flying-field.type';
import { ParsedRow } from '../types/parsed-row.type';
import { ProcessResult } from '../types/process-result.type';
import { MappedEntityBase } from '../types/mapped-entity-base.type';
import { EntityResult } from '../types/entity-result.type';
import { RowResult } from '../types/row-result.type';

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

  /**
   * Processes parsed rows sequentially to ensure correct conflict detection.
   * Rows in the same file often share entity IDs — parallel processing would cause
   * race conditions where later rows silently lose their data due to unique constraint violations.
   */
  public async process(rows: ParsedRow[], username: string): Promise<ProcessResult> {
    this._logger.log(`Processing ${rows.length} rows sequentially — user: ${username}`);
    const results = await rows.reduce<Promise<RowResult[]>>(
      async (acc, row, i) => {
        const prev = await acc;
        try {
          return [...prev, await this._processRow(row, username, i)];
        } catch (error) {
          this._logger.error(`Row ${i} failed unexpectedly — skipped: ${(error as Error).message}`);
          return [...prev, { conflictCount: 0, conflictIds: [], flyingFields: [], totalFields: 0 }];
        }
      },
      Promise.resolve([]),
    );

    return this._aggregateResults(results);
  }

  private _aggregateResults(results: RowResult[]): ProcessResult {
    const conflictCount = results.reduce((sum, r) => sum + r.conflictCount, 0);
    const conflictIds = results.flatMap((r) => r.conflictIds);
    const flyingFields = results.flatMap((r) => r.flyingFields);
    const totalFields = results.reduce((sum, r) => sum + r.totalFields, 0);
    const flyingFieldCount = flyingFields.reduce((sum, f) => sum + f.redFields.length, 0);
    const uploadPercentage = totalFields > 0 ? Math.round(((totalFields - flyingFieldCount) / totalFields) * 100) : 100;
    this._logger.log(`Processing done — ${uploadPercentage}% uploaded, ${conflictCount} conflicts detected`);
    return { conflictCount, conflictIds, flyingFields, uploadPercentage };
  }

  /** Processes a single parsed row leaf-first. */
  private async _processRow(row: ParsedRow, username: string, rowIndex: number): Promise<RowResult> {
    const enriched = this._enricher.enrich(row);

    // Tracks which entity IDs were skipped (UUID-only with no data/FK) so downstream entities
    // can null out any FK references to them before being processed — prevents FK constraint errors.
    const skippedByTable = new Map<string, Set<string>>();

    const run = async (mapped: MappedEntityBase | null, service: EntityService<{ id: string }>): Promise<EntityResult> => {
      const cleaned = this._nullifySkippedFKs(mapped, skippedByTable);
      const result = await this._processEntity(cleaned, service, username, rowIndex);
      if (result.wasSkipped && cleaned?.id) {
        const ids = skippedByTable.get(service.tableName) ?? new Set<string>();
        ids.add(String(cleaned.id));
        skippedByTable.set(service.tableName, ids);
      }
      return result;
    };

    // Level 1 — independent leaves: no FK dependencies on each other
    const [batteryResult, storageResult, ironResult, cardboardResult, sensorResult] = await Promise.all([
      run(this._mapper.mapBattery(enriched), this._registry.get('batteries')),
      run(this._mapper.mapStorage(enriched), this._registry.get('storages')),
      run(this._mapper.mapIron(enriched), this._registry.get('irons')),
      run(this._mapper.mapCardboard(enriched), this._registry.get('cardboards')),
      run(this._mapper.mapSensor(enriched), this._registry.get('sensors')),
    ]);

    // Level 2 — Plastic (needs Battery), Wiring (needs Storage): independent of each other
    const [plasticResult, wiringResult] = await Promise.all([
      run(this._mapper.mapPlastic(enriched), this._registry.get('plastics')),
      run(this._mapper.mapWiring(enriched), this._registry.get('wirings')),
    ]);

    // Level 3 — Communication (needs Plastic + Iron)
    const commResult = await run(this._mapper.mapCommunication(enriched), this._registry.get('communications'));

    // Level 4 — Robot (needs Communication, Wiring, Cardboard, Sensor)
    const robotResult = await run(this._mapper.mapRobot(enriched), this._registry.get('robots'));

    const results: EntityResult[] = [batteryResult, storageResult, ironResult, cardboardResult, sensorResult, plasticResult, wiringResult, commResult, robotResult];

    return {
      conflictCount: results.reduce((sum, r) => sum + r.count, 0),
      conflictIds: results.flatMap((r) => r.conflictIds),
      flyingFields: results.filter((r) => r.flyingField !== null).map((r) => r.flyingField as FlyingField),
      totalFields: results.reduce((sum, r) => sum + r.totalFields, 0),
    };
  }

  /**
   * Returns a copy of the mapped entity with any FK fields that point to a skipped entity nulled out.
   * Prevents FK constraint violations when an upstream entity was skipped (UUID-only, no data).
   * Null propagation cascades: if plastic is skipped and communication then has no remaining
   * non-null fields, it too will be treated as UUID-only and skipped.
   */
  private _nullifySkippedFKs(mapped: MappedEntityBase | null, skippedByTable: Map<string, Set<string>>): MappedEntityBase | null {
    if (!mapped || skippedByTable.size === 0) { return mapped; }
    const record = mapped as unknown as Record<string, EntityValue>;
    const cleaned = { ...record };
    Object.keys(cleaned)
      .filter((k) => k.endsWith('Id') && cleaned[k] !== null)
      .forEach((fkField) => {
        const targetTable = FK_FIELD_TO_TABLE[fkField];
        if (targetTable && skippedByTable.get(targetTable)?.has(String(cleaned[fkField]))) {
          cleaned[fkField] = null;
        }
      });
    return cleaned as unknown as MappedEntityBase;
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
    if (!mapped) { return { count: 0, conflictIds: [], flyingField: null, totalFields: 0, wasSkipped: false }; }

    const mappedRecord = mapped as MappedEntityBase & Record<string, EntityValue>;

    if (!mappedRecord.id) {
      return this._buildMissingIdResult(service.tableName, rowIndex, mappedRecord);
    }

    const { source: incomingSource, notes: incomingNotes, id, ...incomingFields } = mappedRecord;
    const nonNullFieldCount = Object.keys(incomingFields).filter((k) => incomingFields[k] !== null).length;

    // UUID-only row (no data fields) — insert a stub so the entity exists in the DB
    // and flag it in the report so the user knows which fields to fill in.
    if (nonNullFieldCount === 0) {
      return this._handleUuidOnlyRow(service, id, incomingFields, incomingSource, incomingNotes, rowIndex);
    }

    const storedRecord = await service.findById(id);

    if (!storedRecord) {
      return this._insertEntity(service, id, incomingFields, incomingSource, incomingNotes, username, nonNullFieldCount);
    }

    return this._updateExistingEntity(service, id, storedRecord, incomingFields, incomingSource, incomingNotes, username, nonNullFieldCount);
  }

  /** Returns a flying-field result when no UUID is present — marks data fields red so user knows to fill them. */
  private _buildMissingIdResult(tableName: string, rowIndex: number, record: Record<string, EntityValue>): EntityResult {
    // FK fields (e.g. plasticId) have no direct CSV column — only count actual data fields.
    const dataFields = Object.keys(record).filter(
      (k) => k !== 'id' && k !== 'source' && k !== 'notes' && !k.endsWith('Id') && record[k] !== null,
    );
    return {
      count: 0, conflictIds: [],
      flyingField: { entity: tableName, rowIndex, redFields: dataFields, yellowFields: [], isUuidRed: false },
      totalFields: dataFields.length, wasSkipped: false,
    };
  }

  /** Inserts a UUID-only stub and flags all non-FK fields yellow (to be filled in later). */
  private async _handleUuidOnlyRow(
    service: EntityService<{ id: string }>,
    id: string, incomingFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null, rowIndex: number,
  ): Promise<EntityResult> {
    const metaFields = Object.keys(incomingFields).filter((k) => !k.endsWith('Id'));
    try {
      await service.insert({ id, ...incomingFields }, incomingSource, incomingNotes);
    } catch (error) {
      const pgError = error as { code?: string };
      if (!(error instanceof QueryFailedError) || pgError.code !== PG_UNIQUE_VIOLATION) { throw error; }
    }
    return {
      count: 0, conflictIds: [],
      flyingField: { entity: service.tableName, rowIndex, redFields: [], yellowFields: metaFields, isUuidRed: true },
      totalFields: 0, wasSkipped: false,
    };
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
          .map((fkField) => this._detectTwoFathersForFk(service, id, fkField, cleanedFields, incomingSource, incomingNotes, username)),
      )
    ).filter((conflictId): conflictId is number => conflictId !== null);

    try {
      await service.insert({ id, ...cleanedFields }, incomingSource, incomingNotes);
    } catch (error) {
      const pgError = error as { code?: string };
      if (!(error instanceof QueryFailedError) || pgError.code !== PG_UNIQUE_VIOLATION) { throw error; }
    }

    return { count: relationalConflictIds.length, conflictIds: [], flyingField: null, totalFields: nonNullFieldCount, wasSkipped: false };
  }

  /** Checks one FK field for a TWO_FATHERS conflict on insert. Mutates cleanedFields to null out the FK if conflicted. */
  private async _detectTwoFathersForFk(
    service: EntityService<{ id: string }>,
    id: string, fkField: string,
    cleanedFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null,
    username: string,
  ): Promise<number | null> {
    const childId = String(cleanedFields[fkField]);
    const existingOwner = await service.findByFkValue(fkField, childId, id);
    if (!existingOwner) { return null; }

    cleanedFields[fkField] = null;
    const childTable = FK_FIELD_TO_TABLE[fkField];
    const childEntity = await this._registry.get(childTable).findById(childId);

    return this._relationalConflictDetectionService.detectTwoFathers(
      childId, childTable,
      childEntity?.source?.[fkField] ?? null, childEntity?.notes?.[fkField] ?? null,
      existingOwner.id as string, id, service.tableName,
      (existingOwner.source as Record<string, string | null> | null)?.[fkField] ?? null,
      (existingOwner.notes as Record<string, string | null> | null)?.[fkField] ?? null,
      incomingSource, incomingNotes, username,
    );
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

    const conflictIds = await this._persistValueConflicts(result.conflictsToCreate);
    const relationalCount = await this._detectTwoChildsConflicts(service, id, storedRecord, incomingFields, incomingSource, incomingNotes, username);

    // Check FK gap-fills for TWO_FATHERS before applying the update.
    // detectConflicts puts FK fields with stored=null into fieldsToUpdate, but doesn't check
    // whether the incoming child is already owned by another parent — this would violate the
    // OneToOne unique constraint. Detect such cases, remove them from the update, create conflicts.
    const gapFillRelationalCount = await this._checkFkGapFillTwoFathers(
      service, id, result.fieldsToUpdate, result.sourceUpdates, result.notesUpdates,
      incomingSource, incomingNotes, username,
    );

    try {
      if (Object.keys(result.fieldsToUpdate).length > 0) {
        await service.update(id, result.fieldsToUpdate, result.sourceUpdates, storedRecord.source, result.notesUpdates, storedRecord.notes);
      }
    } catch (error) {
      const pgError = error as { code?: string };
      if (!(error instanceof QueryFailedError) || pgError.code !== PG_UNIQUE_VIOLATION) { throw error; }
      this._logger.warn(`Gap-fill update skipped for ${service.tableName}/${id} — unique constraint violation`);
    }

    return { count: result.conflictsToCreate.length + relationalCount + gapFillRelationalCount, conflictIds, flyingField: null, totalFields: nonNullFieldCount, wasSkipped: false };
  }

  /** Persists value conflicts and returns their IDs. Returns empty array if none to create. */
  private async _persistValueConflicts(conflictsToCreate: Record<string, EntityValue>[]): Promise<number[]> {
    if (conflictsToCreate.length === 0) { return []; }
    await this._valueConflictRepository.insertMany(conflictsToCreate, true);
    return this._valueConflictRepository.findOpenIdsByData(
      conflictsToCreate.map((c) => ({
        tableName: c.tableName as string,
        entityId: c.entityId as string,
        columnName: c.columnName as string,
        newValue: c.newValue as string,
      })),
    );
  }

  /**
   * For FK fields being gap-filled (stored null → incoming value), checks whether the target
   * child entity is already owned by another parent (TWO_FATHERS situation).
   * Mutates fieldsToUpdate / sourceUpdates / notesUpdates — removes the conflicting FK field
   * so the caller's update does not attempt to set an already-claimed FK.
   */
  private async _checkFkGapFillTwoFathers(
    service: EntityService<{ id: string }>,
    id: string,
    fieldsToUpdate: Record<string, EntityValue>,
    sourceUpdates: Record<string, string>,
    notesUpdates: Record<string, string | null>,
    incomingSource: string, incomingNotes: string | null,
    username: string,
  ): Promise<number> {
    const fkFields = Object.keys(fieldsToUpdate).filter((k) => k.endsWith('Id'));
    const counts = await Promise.all(
      fkFields.map((fkField) => this._checkOneFkGapFillTwoFathers(service, id, fkField, fieldsToUpdate, sourceUpdates, notesUpdates, incomingSource, incomingNotes, username)),
    );
    return counts.reduce((sum, c) => sum + c, 0);
  }

  /** Checks a single FK field for a TWO_FATHERS conflict during gap-fill. Returns 1 if conflict created, 0 otherwise. */
  private async _checkOneFkGapFillTwoFathers(
    service: EntityService<{ id: string }>,
    id: string, fkField: string,
    fieldsToUpdate: Record<string, EntityValue>,
    sourceUpdates: Record<string, string>,
    notesUpdates: Record<string, string | null>,
    incomingSource: string, incomingNotes: string | null,
    username: string,
  ): Promise<number> {
    const incomingChildId = String(fieldsToUpdate[fkField]);
    const relatedTable = FK_FIELD_TO_TABLE[fkField];
    if (!relatedTable) { return 0; }
    const existingOwner = await service.findByFkValue(fkField, incomingChildId, id);
    if (!existingOwner) { return 0; }

    // Child is already claimed — remove from gap-fill and create a TWO_FATHERS conflict.
    delete fieldsToUpdate[fkField];
    delete sourceUpdates[fkField];
    delete notesUpdates[fkField];

    const childEntity = await this._registry.get(relatedTable).findById(incomingChildId);
    const conflictId = await this._relationalConflictDetectionService.detectTwoFathers(
      incomingChildId, relatedTable,
      childEntity?.source?.[fkField] ?? null, childEntity?.notes?.[fkField] ?? null,
      existingOwner.id as string, id, service.tableName,
      (existingOwner.source as Record<string, string | null> | null)?.[fkField] ?? null,
      (existingOwner.notes as Record<string, string | null> | null)?.[fkField] ?? null,
      incomingSource, incomingNotes, username,
    );
    return conflictId !== null ? 1 : 0;
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
        .map((fkField) => this._detectOneTwoChildsConflict(service, id, fkField, storedRecord, storedRecord_, incomingFields, incomingSource, incomingNotes, username)),
    );

    return results.filter((conflictId): conflictId is number => conflictId !== null).length;
  }

  /** Detects a single TWO_CHILDS relational conflict for a differing FK field. */
  private async _detectOneTwoChildsConflict(
    service: EntityService<{ id: string }>,
    id: string, fkField: string,
    storedRecord: BaseEntity, storedRecord_: Record<string, EntityValue>,
    incomingFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null,
    username: string,
  ): Promise<number | null> {
    const oldRelatedId = String(storedRecord_[fkField]);
    const newRelatedId = String(incomingFields[fkField]);
    const relatedTable = FK_FIELD_TO_TABLE[fkField];
    if (!relatedTable) { return null; }

    return this._relationalConflictDetectionService.detectTwoChilds(
      id, service.tableName,
      storedRecord.source?.[fkField] ?? null, storedRecord.notes?.[fkField] ?? null,
      oldRelatedId, newRelatedId, relatedTable,
      storedRecord.source?.[fkField] ?? null, storedRecord.notes?.[fkField] ?? null,
      incomingSource, incomingNotes, username,
    );
  }
}
