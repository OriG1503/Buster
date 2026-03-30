import { Injectable } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { ConflictReattributionService } from './conflict-reattribution.service';
import { FICTIVE_PARENT_LOOKUP } from '../consts/fictive-parent-lookup.const';

/** Field keys that are metadata/infrastructure and must never be transferred between entities. */
const NON_TRANSFERABLE_KEYS = new Set(['id', 'source', 'notes', 'sourceTime', 'createdAt', 'updatedAt', 'deletedAt']);

@Injectable()
export class FictiveReplacementService {
  public constructor(
    private readonly _registry: EntityServiceRegistry,
    private readonly _conflictReattribution: ConflictReattributionService,
  ) {}

  public isFictive(id: string): boolean {
    return id.startsWith('auto-');
  }

  /**
   * Path B — triggered when inserting a new real entity that wants to own a FK child
   * already owned by a fictive entity in the same table.
   *
   * Steps: clear fictive's FK children → transfer data → reattribute conflicts →
   *        redirect fictive's parent → soft-delete fictive.
   */
  public async replaceOwner(
    ownerTable: string,
    fictiveOwnerId: string,
    newOwnerId: string,
    rowSource: string,
    rowNotes: string | null,
    rowSourceTime: string | null,
  ): Promise<void> {
    const ownerService = this._registry.get(ownerTable);
    const fictive = await ownerService.findById(fictiveOwnerId);
    if (!fictive) { return; }

    await this._clearFkFields(ownerService, fictive);
    await this._transferData(ownerService, fictive, newOwnerId, rowSource, rowNotes, rowSourceTime);
    await this._conflictReattribution.reattribute(fictiveOwnerId, newOwnerId);

    const parentInfo = FICTIVE_PARENT_LOOKUP[ownerTable];
    if (parentInfo) {
      const parentService = this._registry.get(parentInfo.parentTable);
      await this._updateAllParentFks(parentService, parentInfo.fkField, fictiveOwnerId, newOwnerId, rowSource, rowNotes, rowSourceTime);
    }

    await ownerService.softDelete(fictiveOwnerId);
  }

  /**
   * Path A — triggered when an entity's FK is switching from a fictive child to a real one.
   *
   * Steps: clear fictive's FK children → transfer data → reattribute conflicts →
   *        soft-delete fictive → update all parent FKs to real entity.
   */
  public async replaceChild(
    parentService: EntityService<{ id: string }>,
    fkField: string,
    fictiveChildId: string,
    realChildId: string,
    rowSource: string,
    rowNotes: string | null,
    rowSourceTime: string | null,
  ): Promise<void> {
    const childTable = FK_FIELD_TO_TABLE[fkField];
    if (!childTable) { return; }

    const childService = this._registry.get(childTable);
    const fictive = await childService.findById(fictiveChildId);
    if (!fictive) { return; }

    await this._clearFkFields(childService, fictive);
    await this._transferData(childService, fictive, realChildId, rowSource, rowNotes, rowSourceTime);
    await this._conflictReattribution.reattribute(fictiveChildId, realChildId);
    await childService.softDelete(fictiveChildId);
    await this._updateAllParentFks(parentService, fkField, fictiveChildId, realChildId, rowSource, rowNotes, rowSourceTime);
  }

  /** Nulls out all FK fields on the fictive entity to free unique constraints before reassigning them. */
  private async _clearFkFields(service: EntityService<{ id: string }>, fictive: BaseEntity): Promise<void> {
    const fictiveRecord = fictive as unknown as Record<string, EntityValue>;
    const fkFieldsToClear = Object.keys(fictiveRecord).filter((k) => k.endsWith('Id') && k !== 'id' && fictiveRecord[k] != null);
    if (!fkFieldsToClear.length) { return; }

    const clearFields = Object.fromEntries(fkFieldsToClear.map((k) => [k, null]));
    await service.update(fictive.id as string, clearFields, {}, fictive.source, {}, fictive.notes, {}, fictive.sourceTime);
  }

  /**
   * Gap-fills the real entity with the fictive's non-null field values.
   * Uses the in-memory fictive (captured before FK clearing) to preserve original FK values for transfer.
   */
  private async _transferData(
    service: EntityService<{ id: string }>,
    fictive: BaseEntity,
    realId: string,
    rowSource: string,
    rowNotes: string | null,
    rowSourceTime: string | null,
  ): Promise<void> {
    const real = await service.findById(realId);
    if (!real) { return; }

    const fictiveRecord = fictive as unknown as Record<string, EntityValue>;
    const realRecord = real as unknown as Record<string, EntityValue>;

    const transferKeys = Object.keys(fictiveRecord).filter(
      (k) => !NON_TRANSFERABLE_KEYS.has(k) && fictiveRecord[k] != null && realRecord[k] == null,
    );
    if (!transferKeys.length) { return; }

    const fields = Object.fromEntries(transferKeys.map((k) => [k, fictiveRecord[k]]));
    const sourceUpdates = Object.fromEntries(transferKeys.map((k) => [k, rowSource]));
    const notesUpdates = Object.fromEntries(transferKeys.map((k) => [k, rowNotes]));
    const sourceTimeUpdates = Object.fromEntries(transferKeys.map((k) => [k, rowSourceTime]));

    await service.update(realId, fields, sourceUpdates, real.source, notesUpdates, real.notes, sourceTimeUpdates, real.sourceTime);
  }

  /** Updates all entities pointing to the fictive FK value to point to the real entity instead. */
  private async _updateAllParentFks(
    parentService: EntityService<{ id: string }>,
    fkField: string,
    fictiveId: string,
    realId: string,
    rowSource: string,
    rowNotes: string | null,
    rowSourceTime: string | null,
  ): Promise<void> {
    const parents = await parentService.findAllByFkValue(fkField, fictiveId);
    await Promise.all(parents.map((parent) => this._updateOneFk(parentService, parent, fkField, realId, rowSource, rowNotes, rowSourceTime)));
  }

  private async _updateOneFk(
    parentService: EntityService<{ id: string }>,
    parent: BaseEntity,
    fkField: string,
    realId: string,
    rowSource: string,
    rowNotes: string | null,
    rowSourceTime: string | null,
  ): Promise<void> {
    await parentService.update(
      parent.id as string,
      { [fkField]: realId },
      { [fkField]: rowSource },
      parent.source,
      { [fkField]: rowNotes },
      parent.notes,
      { [fkField]: rowSourceTime },
      parent.sourceTime,
    );
  }
}
