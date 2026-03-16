import { Injectable } from '@nestjs/common';
import { DeepPartial, QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../shared/consts/pg-error-codes.const';
import { EntityServiceRegistry } from '../../shared/services/entity-service-registry.service';
import { ConflictRepository } from '../conflict/conflict.repository';
import { ConflictService } from '../conflict/conflict.service';
import { ConflictEntity } from '../conflict/entities/conflict.entity';
import { ParserRowMapper } from './mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';
import { EntityService } from './types/entity-service.type';
import { FlyingField } from './types/flying-field.type';
import { ParsedRow } from './types/parsed-row.type';
import { ProcessResult } from './types/process-result.type';

type EntityResult = {
  count: number;
  flyingField: FlyingField | null;
  totalFields: number;
};

type RowResult = {
  conflictCount: number;
  flyingFields: FlyingField[];
  totalFields: number;
};

@Injectable()
export class DataProcessorService {
  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _enricher: ParsedRowEnricher,
    private readonly _conflictService: ConflictService,
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async process(rows: ParsedRow[], username: string): Promise<ProcessResult> {
    const results = await Promise.all(rows.map((row, i) => this._processRow(row, username, i)));
    const conflictCount = results.reduce((sum, r) => sum + r.conflictCount, 0);
    const flyingFields = results.flatMap((r) => r.flyingFields);
    const totalFields = results.reduce((sum, r) => sum + r.totalFields, 0);
    const flyingFieldCount = flyingFields.reduce((sum, f) => sum + f.fields.length, 0);
    const uploadPercentage = totalFields > 0
      ? Math.round(((totalFields - flyingFieldCount - conflictCount) / totalFields) * 100)
      : 100;
    return { conflictCount, flyingFields, uploadPercentage };
  }

  private async _processRow(row: ParsedRow, username: string, rowIndex: number): Promise<RowResult> {
    const enriched = this._enricher.enrich(row);
    const results: EntityResult[] = [
      await this._processEntity(this._mapper.mapBattery(enriched), this._registry.get('batteries'), username, rowIndex),
      await this._processEntity(this._mapper.mapStorage(enriched), this._registry.get('storages'), username, rowIndex),
      await this._processEntity(this._mapper.mapIron(enriched), this._registry.get('irons'), username, rowIndex),
      await this._processEntity(this._mapper.mapPlastic(enriched), this._registry.get('plastics'), username, rowIndex),
      await this._processEntity(this._mapper.mapWiring(enriched), this._registry.get('wirings'), username, rowIndex),
      await this._processEntity(this._mapper.mapCommunication(enriched), this._registry.get('communications'), username, rowIndex),
      await this._processEntity(this._mapper.mapCardboard(enriched), this._registry.get('cardboards'), username, rowIndex),
      await this._processEntity(this._mapper.mapSensor(enriched), this._registry.get('sensors'), username, rowIndex),
      await this._processEntity(this._mapper.mapSale(enriched), this._registry.get('sales'), username, rowIndex),
      await this._processEntity(this._mapper.mapRobot(enriched), this._registry.get('robots'), username, rowIndex),
    ];
    return {
      conflictCount: results.reduce((sum, r) => sum + r.count, 0),
      flyingFields: results.filter((r) => r.flyingField !== null).map((r) => r.flyingField as FlyingField),
      totalFields: results.reduce((sum, r) => sum + r.totalFields, 0),
    };
  }

  private async _processEntity(
    mapped: ({ id: string; source: string; notes: string | null } & Record<string, unknown>) | null,
    service: EntityService<{ id: string }>,
    username: string,
    rowIndex: number,
  ): Promise<EntityResult> {
    if (!mapped) {
      return { count: 0, flyingField: null, totalFields: 0 };
    }

    if (!mapped.id) {
      const fields = Object.keys(mapped).filter((k) => k !== 'id' && k !== 'source' && k !== 'notes' && mapped[k] !== null);
      return {
        count: 0,
        flyingField: fields.length > 0 ? { entity: service.tableName, fields, rowIndex } : null,
        totalFields: fields.length,
      };
    }

    const { source: incomingSource, notes: incomingNotes, id, ...incomingFields } = mapped;
    // Count of non-null data fields contributed by this entity in this row (excludes id, source, notes)
    // Used as the "total fields" denominator when calculating upload percentage
    const nonNullFieldCount = Object.keys(incomingFields).filter((k) => incomingFields[k] !== null).length;
    const storedRecord = await service.findById(id);

    if (!storedRecord) {
      try {
        await service.insert({ id, ...incomingFields } as { id: string }, incomingSource, incomingNotes);
      } catch (error) {
        if (!(error instanceof QueryFailedError) || (error as any).code !== PG_UNIQUE_VIOLATION) {
          throw error;
        }
      }
      return { count: 0, flyingField: null, totalFields: nonNullFieldCount };
    }

    const result = this._conflictService.detectConflicts(
      service.tableName,
      id,
      storedRecord as Record<string, unknown>,
      storedRecord.source,
      storedRecord.notes,
      incomingFields as Record<string, unknown>,
      incomingSource,
      username,
      incomingNotes,
    );

    await Promise.all(
      result.conflictsToCreate.map((conflict: DeepPartial<ConflictEntity>) =>
        this._conflictRepository.insert(conflict, true),
      ),
    );

    if (Object.keys(result.fieldsToUpdate).length > 0) {
      await service.update(id, result.fieldsToUpdate, result.sourceUpdates, storedRecord.source, result.notesUpdates, storedRecord.notes);
    }

    return { count: result.conflictsToCreate.length, flyingField: null, totalFields: nonNullFieldCount };
  }
}
