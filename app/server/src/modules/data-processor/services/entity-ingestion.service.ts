import { Injectable } from '@nestjs/common';
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
  ) {}

  /** Entry point: routes a mapped entity to insert, update, stub, or missing-id handling. */
  public async processEntity(
    mapped: MappedEntityBase | null,
    service: EntityService<{ id: string }>,
    username: string,
    rowIndex: number,
  ): Promise<EntityResult> {
    if (!mapped) { return EMPTY_RESULT; }

    const record = mapped as MappedEntityBase & Record<string, EntityValue>;
    if (!record.id) { return this._insertService.buildMissingIdResult(service.tableName, rowIndex, record); }

    const { source, notes, sourceTime, id, ...fields } = record;
    const nonNullCount = Object.keys(fields).filter((k) => fields[k] !== null).length;

    if (nonNullCount === 0) { return this._insertService.insertStub(service, id, fields, source, notes, sourceTime, rowIndex); }

    const stored = await service.findById(id);
    return stored
      ? this._updateService.updateExisting(service, id, stored, fields, source, notes, sourceTime, username, nonNullCount)
      : this._insertService.insertNew(service, id, fields, source, notes, sourceTime, username, nonNullCount);
  }
}
