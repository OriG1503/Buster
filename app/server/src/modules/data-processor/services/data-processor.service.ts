import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../../shared/consts/pg-error-codes.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { ConflictRepository } from '../../entities/conflict/conflict.repository';
import { ConflictService } from '../../entities/conflict/services/conflict.service';
import { ParserRowMapper } from '../mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';
import { EntityService } from '../types/entity-service.type';
import { FlyingField } from '../types/flying-field.type';
import { ParsedRow } from '../types/parsed-row.type';
import { ProcessResult } from '../types/process-result.type';
import { MappedEntityBase } from '../types/mapped-entity-base.type';

type EntityResult = { count: number; flyingField: FlyingField | null; totalFields: number };
type RowResult = { conflictCount: number; flyingFields: FlyingField[]; totalFields: number };

@Injectable()
export class DataProcessorService {
  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _enricher: ParsedRowEnricher,
    private readonly _conflictService: ConflictService,
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  /** Processes all parsed rows sequentially and returns aggregate conflict/flying-field stats. */
  public async process(rows: ParsedRow[], username: string): Promise<ProcessResult> {
    const results = await rows.reduce(
      async (acc, row, i) => [...(await acc), await this._processRow(row, username, i)],
      Promise.resolve([] as RowResult[]),
    );

    const conflictCount = results.reduce((sum, r) => sum + r.conflictCount, 0);
    const flyingFields = results.flatMap((r) => r.flyingFields);
    const totalFields = results.reduce((sum, r) => sum + r.totalFields, 0);
    const flyingFieldCount = flyingFields.reduce((sum, f) => sum + f.fields.length, 0);
    const uploadPercentage = totalFields > 0 ? Math.round(((totalFields - flyingFieldCount) / totalFields) * 100) : 100;

    return { conflictCount, flyingFields, uploadPercentage };
  }

  /**
   * Processes a single parsed row leaf-first.
   * Looks up prior FK IDs from the stored robot so renamed intermediate entities
   * (Communication, Plastic, Wiring) can be renamed in-place rather than re-inserted.
   */
  private async _processRow(row: ParsedRow, username: string, rowIndex: number): Promise<RowResult> {
    const enriched = this._enricher.enrich(row);

    const storedRobot = await this._registry.get('robots').findById(enriched.robot_UUID);
    const storedRobotFields = storedRobot as unknown as Record<string, string | null> | null;
    const currentCommId = storedRobotFields?.['communicationId'] ?? null;
    const currentWiringId = storedRobotFields?.['wiringId'] ?? null;

    const storedComm = currentCommId ? await this._registry.get('communications').findById(currentCommId) : null;
    const currentPlasticId = storedComm ? (storedComm as unknown as Record<string, string | null>)['plasticId'] ?? null : null;

    const commPriorId = currentCommId ?? undefined;
    const mappedComm = this._mapper.mapCommunication(enriched);
    const commWasRenamed = storedComm !== null && commPriorId !== undefined && mappedComm?.id != null && commPriorId !== mappedComm.id;

    const results: EntityResult[] = [
      await this._processEntity(this._mapper.mapBattery(enriched), this._registry.get('batteries'), username, rowIndex),
      await this._processEntity(this._mapper.mapStorage(enriched), this._registry.get('storages'), username, rowIndex),
      await this._processEntity(this._mapper.mapIron(enriched), this._registry.get('irons'), username, rowIndex),
      await this._processEntity(this._mapper.mapPlastic(enriched), this._registry.get('plastics'), username, rowIndex, currentPlasticId ?? undefined),
      await this._processEntity(this._mapper.mapWiring(enriched), this._registry.get('wirings'), username, rowIndex, currentWiringId ?? undefined),
      await this._processEntity(mappedComm, this._registry.get('communications'), username, rowIndex, commPriorId),
      await this._processEntity(this._mapper.mapCardboard(enriched), this._registry.get('cardboards'), username, rowIndex),
      await this._processEntity(this._mapper.mapSensor(enriched), this._registry.get('sensors'), username, rowIndex),
      await this._processEntity(this._mapper.mapSale(enriched), this._registry.get('sales'), username, rowIndex),
      await this._processEntity(this._mapper.mapRobot(enriched), this._registry.get('robots'), username, rowIndex),
    ];

    if (commWasRenamed) {
      const robotService = this._registry.get('robots');
      const currentRobot = await robotService.findById(enriched.robot_UUID);
      if (currentRobot) {
        await robotService.update(enriched.robot_UUID, {}, { communicationId: mappedComm!.source }, currentRobot.source, { communicationId: mappedComm!.notes }, currentRobot.notes);
      }
    }

    return {
      conflictCount: results.reduce((sum, r) => sum + r.count, 0),
      flyingFields: results.filter((r) => r.flyingField !== null).map((r) => r.flyingField as FlyingField),
      totalFields: results.reduce((sum, r) => sum + r.totalFields, 0),
    };
  }

  /**
   * Inserts or conflict-checks a single mapped entity.
   * - No mapped data → skip.
   * - Missing id → flying field (data exists but no UUID to anchor it).
   * - Not found + priorId → rename the prior record to the new id.
   * - Not found → insert.
   * - Found → detect conflicts, gap-fill nulls.
   */
  /**
   * Orchestrates a single mapped entity: skips nulls, flags flying fields,
   * then delegates to insert or conflict-check depending on whether the record exists.
   */
  private async _processEntity(
    mapped: MappedEntityBase | null,
    service: EntityService<{ id: string }>,
    username: string, rowIndex: number, priorId?: string,
  ): Promise<EntityResult> {
    if (!mapped) { return { count: 0, flyingField: null, totalFields: 0 }; }

    const mappedRecord = mapped as MappedEntityBase & Record<string, EntityValue>;

    if (!mappedRecord.id) {
      const fields = Object.keys(mappedRecord).filter((k) => k !== 'id' && k !== 'source' && k !== 'notes' && mappedRecord[k] !== null);
      return { count: 0, flyingField: fields.length > 0 ? { entity: service.tableName, fields, rowIndex } : null, totalFields: fields.length };
    }

    const { source: incomingSource, notes: incomingNotes, id, ...incomingFields } = mappedRecord;
    // Non-null data fields only (excludes id/source/notes) — used as the upload percentage denominator
    const nonNullFieldCount = Object.keys(incomingFields).filter((k) => incomingFields[k] !== null).length;

    let storedRecord = await service.findById(id);
    if (!storedRecord && priorId && priorId !== id) {
      storedRecord = await this._resolveByPriorId(service, id, priorId, incomingSource, incomingNotes);
    }

    if (!storedRecord) {
      return this._insertEntity(service, id, incomingFields, incomingSource, incomingNotes, nonNullFieldCount);
    }

    return this._updateExistingEntity(service, id, storedRecord, incomingFields, incomingSource, incomingNotes, username, nonNullFieldCount);
  }

  /**
   * Renames a prior entity ID to the new incoming ID and updates its source tracking.
   * Returns the record under the new ID, or null if the prior record was not found.
   */
  private async _resolveByPriorId(
    service: EntityService<{ id: string }>,
    id: string, priorId: string, incomingSource: string, incomingNotes: string | null,
  ) {
    const priorRecord = await service.findById(priorId);
    if (!priorRecord) { return null; }
    await service.renameId(priorId, id);
    await service.update(id, {}, { id: incomingSource }, priorRecord.source, { id: incomingNotes }, priorRecord.notes);
    return service.findById(id);
  }

  /**
   * Inserts a new entity record, ignoring unique-constraint violations
   * (race condition guard for concurrent uploads of the same row).
   */
  private async _insertEntity(
    service: EntityService<{ id: string }>,
    id: string, incomingFields: Record<string, EntityValue>,
    incomingSource: string, incomingNotes: string | null, nonNullFieldCount: number,
  ): Promise<EntityResult> {
    try {
      await service.insert({ id, ...incomingFields }, incomingSource, incomingNotes);
    } catch (error) {
      if (!(error instanceof QueryFailedError) || (error as any).code !== PG_UNIQUE_VIOLATION) { throw error; }
    }
    return { count: 0, flyingField: null, totalFields: nonNullFieldCount };
  }

  /**
   * Runs conflict detection against the stored record, bulk-inserts any new ConflictEntities,
   * and gap-fills null fields with incoming values.
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

    await Promise.all(result.conflictsToCreate.map((conflict) => this._conflictRepository.insert(conflict, true)));

    if (Object.keys(result.fieldsToUpdate).length > 0) {
      await service.update(id, result.fieldsToUpdate, result.sourceUpdates, storedRecord.source, result.notesUpdates, storedRecord.notes);
    }

    return { count: result.conflictsToCreate.length, flyingField: null, totalFields: nonNullFieldCount };
  }
}
