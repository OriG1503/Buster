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

  public async process(rows: ParsedRow[]): Promise<void> {
    await Promise.all(rows.map((row) => this._processRow(row)));
  }

  private async _processRow(row: ParsedRow): Promise<void> {
    const enriched = this._enricher.enrich(row);

    await this._processEntity(this._mapper.mapBattery(enriched), this._registry.get('batteries'));
    await this._processEntity(this._mapper.mapStorage(enriched), this._registry.get('storages'));
    await this._processEntity(this._mapper.mapIron(enriched), this._registry.get('irons'));
    await this._processEntity(this._mapper.mapPlastic(enriched), this._registry.get('plastics'));
    await this._processEntity(this._mapper.mapWiring(enriched), this._registry.get('wirings'));
    await this._processEntity(this._mapper.mapCommunication(enriched), this._registry.get('communications'));
    await this._processEntity(this._mapper.mapCardboard(enriched), this._registry.get('cardboards'));
    await this._processEntity(this._mapper.mapSensor(enriched), this._registry.get('sensors'));
    await this._processEntity(this._mapper.mapSale(enriched), this._registry.get('sales'));
    await this._processEntity(this._mapper.mapRobot(enriched), this._registry.get('robots'));
  }

  private async _processEntity(
    mapped: ({ id: string; fileSource: string } & Record<string, unknown>) | null,
    service: EntityService<{ id: string }>,
  ): Promise<void> {
    if (!mapped?.id) {
      return;
    }

    const { fileSource: incomingSource, id, ...incomingFields } = mapped;
    const storedRecord = await service.findById(id);

    if (!storedRecord) {
      try {
        await service.insert({ id, ...incomingFields } as { id: string }, incomingSource);
      } catch (error) {
        if (!(error instanceof QueryFailedError) || (error as any).code !== PG_UNIQUE_VIOLATION) {
          throw error;
        }
      }
      return;
    }

    const result = this._conflictService.detectConflicts(
      service.tableName,
      id,
      storedRecord as Record<string, unknown>,
      storedRecord.source,
      incomingFields as Record<string, unknown>,
      incomingSource,
    );

    await Promise.all(
      result.conflictsToCreate.map((conflict: DeepPartial<ConflictEntity>) =>
        this._conflictRepository.insert(conflict),
      ),
    );

    if (Object.keys(result.fieldsToUpdate).length > 0) {
      await service.update(id, result.fieldsToUpdate, result.sourceUpdates, storedRecord.source);
    }
  }
}
