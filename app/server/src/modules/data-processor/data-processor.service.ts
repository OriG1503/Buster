import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../shared/consts/pg-error-codes.const';
import { EntityValue } from '../../shared/types/entity-value.type';
import { EntityServiceRegistry } from '../../shared/services/entity-service-registry.service';
import { ConflictRepository } from '../conflict/conflict.repository';
import { ConflictService } from '../conflict/conflict.service';
import { ParserRowMapper } from './mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';
import { EntityService } from './types/entity-service.type';
import { ParsedRow } from './types/parsed-row.type';

@Injectable()
export class DataProcessorService {
  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _enricher: ParsedRowEnricher,
    private readonly _conflictService: ConflictService,
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async process(rows: ParsedRow[], username: string): Promise<number> {
    const counts = await Promise.all(rows.map((row) => this._processRow(row, username)));
    return counts.reduce((sum, count) => sum + count, 0);
  }

  private async _processRow(row: ParsedRow, username: string): Promise<number> {
    const enriched = this._enricher.enrich(row);
    const counts = [
      await this._processEntity(this._mapper.mapBattery(enriched), this._registry.get('batteries'), username),
      await this._processEntity(this._mapper.mapStorage(enriched), this._registry.get('storages'), username),
      await this._processEntity(this._mapper.mapIron(enriched), this._registry.get('irons'), username),
      await this._processEntity(this._mapper.mapPlastic(enriched), this._registry.get('plastics'), username),
      await this._processEntity(this._mapper.mapWiring(enriched), this._registry.get('wirings'), username),
      await this._processEntity(this._mapper.mapCommunication(enriched), this._registry.get('communications'), username),
      await this._processEntity(this._mapper.mapCardboard(enriched), this._registry.get('cardboards'), username),
      await this._processEntity(this._mapper.mapSensor(enriched), this._registry.get('sensors'), username),
      await this._processEntity(this._mapper.mapSale(enriched), this._registry.get('sales'), username),
      await this._processEntity(this._mapper.mapRobot(enriched), this._registry.get('robots'), username),
    ];
    return counts.reduce((sum, count) => sum + count, 0);
  }

  private async _processEntity(
    mapped: ({ id: string; source: string; notes: string | null } & Record<string, EntityValue>) | null,
    service: EntityService<{ id: string }>,
    username: string,
  ): Promise<number> {
    if (!mapped?.id) {
      return 0;
    }

    const { source: incomingSource, notes: incomingNotes, id, ...incomingFields } = mapped;
    const storedRecord = await service.findById(id);

    if (!storedRecord) {
      try {
        await service.insert({ id, ...incomingFields }, incomingSource, incomingNotes);
      } catch (error) {
        if (!(error instanceof QueryFailedError) || (error as any).code !== PG_UNIQUE_VIOLATION) {
          throw error;
        }
      }
      return 0;
    }

    const result = this._conflictService.detectConflicts(
      service.tableName,
      id,
      storedRecord as object as Record<string, EntityValue>,
      storedRecord.source,
      storedRecord.notes,
      incomingFields,
      incomingSource,
      username,
      incomingNotes,
    );

    await Promise.all(
      result.conflictsToCreate.map((conflict) =>
        this._conflictRepository.insert(conflict, true),
      ),
    );

    if (Object.keys(result.fieldsToUpdate).length > 0) {
      await service.update(id, result.fieldsToUpdate, result.sourceUpdates, storedRecord.source, result.notesUpdates, storedRecord.notes);
    }

    return result.conflictsToCreate.length;
  }
}
