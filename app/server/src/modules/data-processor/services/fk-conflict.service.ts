import { Injectable } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { ONE_TO_ONE_FK_FIELDS } from '../../../shared/consts/one-to-one-fk-fields.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { RelationalConflictDetectionService } from '../../entities/conflict/services/relational-conflict-detection.service';
import { FictiveReplacementService } from '../../fictive/services/fictive-replacement.service';
import { FictiveIdService } from '../../fictive/services/fictive-id.service';

export type FictiveChildReplacement = { fkField: string; fictiveChildId: string; realChildId: string };
export type TwoChildsResult = { conflictCount: number; fictiveReplacements: FictiveChildReplacement[] };

type TwoChildsCheckOutcome =
  | { kind: 'conflict' }
  | { kind: 'fictive'; fkField: string; fictiveChildId: string; realChildId: string }
  | null;

@Injectable()
export class FkConflictService {
  public constructor(
    private readonly _relationalConflictService: RelationalConflictDetectionService,
    private readonly _registry: EntityServiceRegistry,
    private readonly _fictiveReplacement: FictiveReplacementService,
    private readonly _fictiveId: FictiveIdService,
  ) {}

  /**
   * Checks all OneToOne FK fields on a new entity being inserted for TWO_FATHERS conflicts.
   * When the existing owner is a fictive entity, auto-replaces it instead of raising a conflict.
   * Returns the FK field names that were genuinely conflicted (caller must null these before inserting).
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

    if (this._fictiveId.isFictive(String(existingOwner.id))) {
      await this._fictiveReplacement.replaceOwner(service.tableName, String(existingOwner.id), id, { source, notes, sourceTime });
      return null;
    }

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
   * Checks FK fields where both stored and incoming values are non-null and differ.
   * When the stored value is a fictive entity, returns it as a replacement candidate instead of a conflict.
   */
  public async detectTwoChilds(
    service: EntityService<{ id: string }>,
    id: string,
    stored: BaseEntity,
    fields: Record<string, EntityValue>,
    source: string,
    notes: string | null,
    sourceTime: string | null,
    username: string,
  ): Promise<TwoChildsResult> {
    const storedRecord = stored as unknown as Record<string, EntityValue>;
    const outcomes = await Promise.all(
      Object.keys(fields)
        .filter((f) => {
          if (!f.endsWith('Id')) { return false; }
          const storedVal = storedRecord[f];
          const incomingVal = fields[f];
          return storedVal != null && incomingVal != null && storedVal !== incomingVal;
        })
        .map((fkField) => this._checkOneTwoChilds(service, id, fkField, stored, storedRecord, fields, source, notes, sourceTime, username)),
    );

    const conflictCount = outcomes.filter((o): o is { kind: 'conflict' } => o?.kind === 'conflict').length;
    const fictiveReplacements = outcomes
      .filter((o): o is { kind: 'fictive'; fkField: string; fictiveChildId: string; realChildId: string } => o?.kind === 'fictive')
      .map(({ fkField, fictiveChildId, realChildId }) => ({ fkField, fictiveChildId, realChildId }));

    return { conflictCount, fictiveReplacements };
  }

  private async _checkOneTwoChilds(
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
  ): Promise<TwoChildsCheckOutcome> {
    const storedFkId = String(storedRecord[fkField]);
    const incomingFkId = String(fields[fkField]);

    if (this._fictiveId.isFictive(storedFkId) && !this._fictiveId.isFictive(incomingFkId)) {
      return { kind: 'fictive', fkField, fictiveChildId: storedFkId, realChildId: incomingFkId };
    }

    const relatedTable = FK_FIELD_TO_TABLE[fkField];
    if (!relatedTable) { return null; }

    await this._relationalConflictService.detectTwoChilds(
      id, service.tableName,
      stored.source?.[fkField] ?? null, stored.notes?.[fkField] ?? null, stored.sourceTime?.[fkField] ?? null,
      storedFkId, incomingFkId, relatedTable,
      stored.source?.[fkField] ?? null, stored.notes?.[fkField] ?? null, stored.sourceTime?.[fkField] ?? null,
      source, notes, sourceTime, username,
    );
    return { kind: 'conflict' };
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
}
