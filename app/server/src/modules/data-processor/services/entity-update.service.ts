import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../../shared/consts/pg-error-codes.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { ValueConflictRepository } from '../../entities/conflict/value-conflict.repository';
import { ValueConflictService } from '../../entities/conflict/services/value-conflict.service';
import { EntityResult } from '../types/entity-result.type';
import { FkConflictService } from './fk-conflict.service';
import { FictiveReplacementService } from './fictive-replacement.service';

@Injectable()
export class EntityUpdateService {
  private readonly _logger = new Logger(EntityUpdateService.name);

  public constructor(
    private readonly _conflictService: ValueConflictService,
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _fkConflictService: FkConflictService,
    private readonly _fictiveReplacement: FictiveReplacementService,
  ) {}

  /**
   * Detects value and relational conflicts against the stored record,
   * then applies gap-fills (stored null → incoming value) for all non-conflicting fields.
   * Fictive FK values are auto-replaced rather than raised as conflicts.
   */
  public async updateExisting(
    service: EntityService<{ id: string }>,
    id: string,
    stored: BaseEntity,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
    nonNullCount: number,
  ): Promise<EntityResult> {
    const result = this._conflictService.detectConflicts(
      service.tableName, id,
      stored as object as Record<string, EntityValue>,
      stored.source, stored.notes, stored.sourceTime,
      fields, source, username, notes, sourceTime,
    );

    const conflictIds = await this._persistValueConflicts(result.conflictsToCreate);

    const { conflictCount: twoChildsCount, fictiveReplacements } = await this._fkConflictService.detectTwoChilds(
      service, id, stored, fields, source, notes, sourceTime, username,
    );

    await Promise.all(
      fictiveReplacements.map(({ fkField, fictiveChildId, realChildId }) =>
        this._fictiveReplacement.replaceChild(service, fkField, fictiveChildId, realChildId, source, notes, sourceTime),
      ),
    );

    const { conflictCount: gapFillConflictCount, conflictedFkFields } = await this._fkConflictService.detectTwoFathersOnGapFill(
      service, id, result.fieldsToUpdate, source, notes, sourceTime, username,
    );

    conflictedFkFields.forEach((fkField) => {
      delete result.fieldsToUpdate[fkField];
      delete result.sourceUpdates[fkField];
      delete result.notesUpdates[fkField];
      delete result.sourceTimeUpdates[fkField];
    });

    try {
      if (Object.keys(result.fieldsToUpdate).length > 0) {
        await service.update(id, result.fieldsToUpdate, result.sourceUpdates, stored.source, result.notesUpdates, stored.notes, result.sourceTimeUpdates, stored.sourceTime);
      }
    } catch (error) {
      const pgError = error as { code?: string };
      if (!(error instanceof QueryFailedError) || pgError.code !== PG_UNIQUE_VIOLATION) { throw error; }
      this._logger.warn(`Gap-fill update skipped for ${service.tableName}/${id} — unique constraint violation`);
    }

    return {
      count: result.conflictsToCreate.length + twoChildsCount + gapFillConflictCount,
      conflictIds, flyingField: null, totalFields: nonNullCount, wasSkipped: false,
    };
  }

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
}
