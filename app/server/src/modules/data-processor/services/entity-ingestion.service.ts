import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { MappedEntityBase } from '../types/mapped-entity-base.type';
import { EntityResult } from '../types/entity-result.type';
import { EntityInsertService } from './entity-insert.service';
import { EntityUpdateService } from './entity-update.service';

const EMPTY_RESULT: EntityResult = { count: 0, conflictIds: [], flyingField: null, totalFields: 0, wasSkipped: false };

@Injectable()
export class EntityIngestionService {
  public constructor(
    private readonly _insertService: EntityInsertService,
    private readonly _updateService: EntityUpdateService,
    private readonly _logger: LoggerService,
  ) {}

  /** Entry point: routes a mapped entity to insert, update, stub, or missing-id handling. */
  public async processEntity(
    mapped: MappedEntityBase | null,
    service: EntityService<{ id: string }>,
    username: string,
    rowIndex: number,
  ): Promise<EntityResult> {
    if (!mapped) {
      this._logger.debug(
        `EntityIngestionService — skipping empty entity for table "${service.tableName}" row ${rowIndex}`,
        'app-workflow',
      );
      return EMPTY_RESULT;
    }

    const record = mapped as MappedEntityBase & Record<string, EntityValue>;
    if (!record.id) {
      this._logger.warn(
        `EntityIngestionService — missing id on table "${service.tableName}" row ${rowIndex}, marking as flying-field`,
        'app-workflow',
      );
      return this._insertService.buildMissingIdResult(service.tableName, rowIndex, record);
    }

    const { source, notes, sourceTime, id, ...fields } = record;
    const nonNullCount = Object.keys(fields).filter((k) => fields[k] !== null).length;

    if (nonNullCount === 0) {
      this._logger.debug(
        `EntityIngestionService — inserting stub for "${service.tableName}/${id}" (no data fields)`,
        'app-workflow',
      );
      return this._insertService.insertStub(service, id, fields, source, notes, sourceTime, rowIndex);
    }

    const stored = await service.findById(id);
    if (stored) {
      this._logger.info(
        `EntityIngestionService — updating existing "${service.tableName}/${id}" with ${nonNullCount} field(s)`,
        'app-workflow',
      );
      return this._updateService.updateExisting(
        service,
        id,
        stored,
        fields,
        source,
        notes,
        sourceTime,
        username,
        nonNullCount,
      );
    }
    this._logger.info(
      `EntityIngestionService — inserting new "${service.tableName}/${id}" with ${nonNullCount} field(s)`,
      'app-workflow',
    );
    return this._insertService.insertNew(service, id, fields, source, notes, sourceTime, username, nonNullCount);
  }
}
