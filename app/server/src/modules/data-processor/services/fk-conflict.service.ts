import { Injectable } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { ONE_TO_ONE_FK_FIELDS } from '../../../shared/consts/one-to-one-fk-fields.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { RelationalConflictDetectionService } from '../../entities/conflict/services/relational-conflict-detection.service';

@Injectable()
export class FkConflictService {
  public constructor(
    private readonly _relationalConflictService: RelationalConflictDetectionService,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  /**
   * Checks all OneToOne FK fields on a new entity being inserted for TWO_FATHERS conflicts.
   * Returns the count of conflicts found and the FK field names that were conflicted
   * (caller must null these out before inserting).
   */
  public async detectTwoFathersOnInsert(
    service: EntityService<{ id: string }>,
    id: string,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<{ conflictCount: number; conflictedFkFields: Set<string> }> {
    const results = await Promise.all(
      Object.keys(fields)
        .filter((f) => f.endsWith('Id') && ONE_TO_ONE_FK_FIELDS.has(f) && fields[f] != null)
        .map((fkField) => this._checkOneFkTwoFathersOnInsert(service, id, fkField, fields, source, notes, sourceTime, username)),
    );
    const conflictedFkFields = new Set(results.filter((f): f is string => f !== null));
    return { conflictCount: conflictedFkFields.size, conflictedFkFields };
  }

  private async _checkOneFkTwoFathersOnInsert(
    service: EntityService<{ id: string }>,
    id: string,
    fkField: string,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<string | null> {
    const childId = String(fields[fkField]);
    const existingOwner = await service.findByFkValue(fkField, childId, id);
    if (!existingOwner) { return null; }

    const childTable = FK_FIELD_TO_TABLE[fkField];
    const childEntity = await this._registry.get(childTable).findById(childId);
    await this._relationalConflictService.detectTwoFathers(
      childId, childTable,
      childEntity?.source?.[fkField] ?? null, childEntity?.notes?.[fkField] ?? null, childEntity?.sourceTime?.[fkField] ?? null,
      existingOwner.id as string, id, service.tableName,
      existingOwner.source?.[fkField] ?? null,
      existingOwner.notes?.[fkField] ?? null,
      existingOwner.sourceTime?.[fkField] ?? null,
      source, notes, sourceTime, username,
    );
    return fkField;
  }

  /**
   * Checks FK fields being gap-filled for TWO_FATHERS conflicts.
   * Returns conflict count and the FK field names that were conflicted
   * (caller must remove these from the update objects).
   */
  public async detectTwoFathersOnGapFill(
    service: EntityService<{ id: string }>,
    id: string,
    fieldsToUpdate: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<{ conflictCount: number; conflictedFkFields: string[] }> {
    const results = await Promise.all(
      Object.keys(fieldsToUpdate)
        .filter((k) => k.endsWith('Id'))
        .map((fkField) => this._checkOneFkTwoFathersOnGapFill(service, id, fkField, fieldsToUpdate, source, notes, sourceTime, username)),
    );
    const conflictedFkFields = results.filter((f): f is string => f !== null);
    return { conflictCount: conflictedFkFields.length, conflictedFkFields };
  }

  private async _checkOneFkTwoFathersOnGapFill(
    service: EntityService<{ id: string }>,
    id: string,
    fkField: string,
    fieldsToUpdate: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<string | null> {
    const childId = String(fieldsToUpdate[fkField]);
    const relatedTable = FK_FIELD_TO_TABLE[fkField];
    if (!relatedTable) { return null; }
    const existingOwner = await service.findByFkValue(fkField, childId, id);
    if (!existingOwner) { return null; }

    const childEntity = await this._registry.get(relatedTable).findById(childId);
    await this._relationalConflictService.detectTwoFathers(
      childId, relatedTable,
      childEntity?.source?.[fkField] ?? null, childEntity?.notes?.[fkField] ?? null, childEntity?.sourceTime?.[fkField] ?? null,
      existingOwner.id as string, id, service.tableName,
      existingOwner.source?.[fkField] ?? null,
      existingOwner.notes?.[fkField] ?? null,
      existingOwner.sourceTime?.[fkField] ?? null,
      source, notes, sourceTime, username,
    );
    return fkField;
  }

  /** Checks FK fields where both stored and incoming values are non-null and differ — TWO_CHILDS conflicts. */
  public async detectTwoChilds(
    service: EntityService<{ id: string }>,
    id: string,
    stored: BaseEntity,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<number> {
    const storedRecord = stored as unknown as Record<string, EntityValue>;
    const results = await Promise.all(
      Object.keys(fields)
        .filter((f) => {
          if (!f.endsWith('Id')) { return false; }
          const storedVal = storedRecord[f];
          const incomingVal = fields[f];
          return storedVal != null && incomingVal != null && storedVal !== incomingVal;
        })
        .map((fkField) => this._detectOneTwoChildsConflict(service, id, fkField, stored, storedRecord, fields, source, notes, sourceTime, username)),
    );
    return results.filter((r): r is number => r !== null).length;
  }

  private async _detectOneTwoChildsConflict(
    service: EntityService<{ id: string }>,
    id: string,
    fkField: string,
    stored: BaseEntity,
    storedRecord: Record<string, EntityValue>,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<number | null> {
    const relatedTable = FK_FIELD_TO_TABLE[fkField];
    if (!relatedTable) { return null; }
    return this._relationalConflictService.detectTwoChilds(
      id, service.tableName,
      stored.source?.[fkField] ?? null, stored.notes?.[fkField] ?? null, stored.sourceTime?.[fkField] ?? null,
      String(storedRecord[fkField]), String(fields[fkField]), relatedTable,
      stored.source?.[fkField] ?? null, stored.notes?.[fkField] ?? null, stored.sourceTime?.[fkField] ?? null,
      source, notes, sourceTime, username,
    );
  }
}
