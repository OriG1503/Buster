import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../../shared/consts/pg-error-codes.const';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityResult } from '../types/entity-result.type';
import { FlyingField } from '../types/flying-field.type';
import { FkConflictService } from './fk-conflict.service';

@Injectable()
export class EntityInsertService {
  public constructor(
    private readonly _fkConflictService: FkConflictService,
    private readonly _logger: LoggerService,
  ) {}

  /** Flying-field result when no UUID is present — data fields are red so user knows to fill them. */
  public buildMissingIdResult(tableName: string, rowIndex: number, record: Record<string, EntityValue>): EntityResult {
    const dataFields = Object.keys(record).filter(
      (k) => k !== 'id' && k !== 'source' && k !== 'notes' && !k.endsWith('Id') && record[k] !== null,
    );
    return {
      count: 0,
      conflictIds: [],
      flyingField: {
        entity: tableName,
        rowIndex,
        redFields: dataFields,
        yellowFields: [],
        isUuidRed: false,
      } as FlyingField,
      totalFields: dataFields.length,
      wasSkipped: false,
    };
  }

  /** Inserts a UUID-only stub and marks all non-FK fields yellow (to be filled in later). */
  public async insertStub(
    service: EntityService<{ id: string }>,
    id: string,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    rowIndex: number,
  ): Promise<EntityResult> {
    const yellowFields = Object.keys(fields).filter((k) => !k.endsWith('Id'));
    //LOG
    this._logger.debug(
      `EntityInsertService.insertStub — inserting stub "${service.tableName}/${id}" (yellowFields=[${yellowFields.join(', ')}])`,
      'app-workflow',
    );
    try {
      await service.insert({ id, ...fields }, source, notes, sourceTime);
    } catch (error) {
      const pgError = error as { code?: string };
      if (!(error instanceof QueryFailedError) || pgError.code !== PG_UNIQUE_VIOLATION) {
        throw error;
      }
      //LOG
      this._logger.warn(
        `EntityInsertService.insertStub — unique violation on "${service.tableName}/${id}", treated as no-op`,
        'app-workflow',
      );
    }
    return {
      count: 0,
      conflictIds: [],
      flyingField: { entity: service.tableName, rowIndex, redFields: [], yellowFields, isUuidRed: true } as FlyingField,
      totalFields: 0,
      wasSkipped: false,
    };
  }

  /**
   * Inserts a new entity. Checks OneToOne FKs for TWO_FATHERS conflicts first —
   * conflicted FK fields are nulled out before inserting.
   */
  public async insertNew(
    service: EntityService<{ id: string }>,
    id: string,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
    nonNullCount: number,
  ): Promise<EntityResult> {
    const { conflictCount, conflictedFkFields } = await this._fkConflictService.detectTwoFathersOnInsert(
      service,
      id,
      fields,
      source,
      notes,
      sourceTime,
      username,
    );

    const cleanedFields = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, conflictedFkFields.has(k) ? null : v]),
    );

    if (conflictedFkFields.size > 0) {
      //LOG
      this._logger.warn(
        `EntityInsertService.insertNew — nulling FK fields [${[...conflictedFkFields].join(', ')}] on "${service.tableName}/${id}" due to TWO_FATHERS conflicts`,
        'app-workflow',
      );
    }

    try {
      //LOG
      this._logger.debug(
        `EntityInsertService.insertNew — inserting "${service.tableName}/${id}" with ${nonNullCount} field(s) by "${username}"`,
        'app-workflow',
      );
      await service.insert({ id, ...cleanedFields }, source, notes, sourceTime);
    } catch (error) {
      const pgError = error as { code?: string };
      if (!(error instanceof QueryFailedError) || pgError.code !== PG_UNIQUE_VIOLATION) {
        throw error;
      }
      //LOG
      this._logger.warn(
        `EntityInsertService.insertNew — unique violation on "${service.tableName}/${id}" (likely concurrent insert), ignored`,
        'app-workflow',
      );
    }

    return { count: conflictCount, conflictIds: [], flyingField: null, totalFields: nonNullCount, wasSkipped: false };
  }
}
