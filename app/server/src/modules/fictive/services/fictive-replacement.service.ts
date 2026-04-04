import { Injectable } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { FICTIVE_PARENT_LOOKUP } from '../consts/fictive-parent-lookup.const';
import { RowMeta } from '../types/row-meta.type';
import { ConflictReattributionService } from './conflict-reattribution.service';
import { FictiveDataTransferService } from './fictive-data-transfer.service';
import { FictiveParentRedirectService } from './fictive-parent-redirect.service';

@Injectable()
export class FictiveReplacementService {
  public constructor(
    private readonly _registry: EntityServiceRegistry,
    private readonly _conflictReattribution: ConflictReattributionService,
    private readonly _dataTransfer: FictiveDataTransferService,
    private readonly _parentRedirect: FictiveParentRedirectService,
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
  public async replaceOwner(ownerTable: string, fictiveOwnerId: string, newOwnerId: string, meta: RowMeta): Promise<void> {
    const ownerService = this._registry.get(ownerTable);
    const fictive = await ownerService.findById(fictiveOwnerId);
    if (!fictive) { return; }

    await this._dataTransfer.clearFkFields(ownerService, fictive);
    await this._dataTransfer.transferData(ownerService, fictive, newOwnerId, meta);
    await this._conflictReattribution.reattribute(fictiveOwnerId, newOwnerId);

    const parentInfo = FICTIVE_PARENT_LOOKUP[ownerTable];
    if (parentInfo) {
      const parentService = this._registry.get(parentInfo.parentTable);
      await this._parentRedirect.redirectAll(parentService, parentInfo.fkField, fictiveOwnerId, newOwnerId, meta);
    }

    await ownerService.softDelete(fictiveOwnerId);
  }

  /**
   * Path A — triggered when an entity's FK is switching from a fictive child to a real one.
   *
   * Steps: clear fictive's FK children → transfer data → reattribute conflicts →
   *        soft-delete fictive → redirect parent FKs to real entity.
   */
  public async replaceChild(
    parentService: EntityService<{ id: string }>,
    fkField: string,
    fictiveChildId: string,
    realChildId: string,
    meta: RowMeta,
  ): Promise<void> {
    const childTable = FK_FIELD_TO_TABLE[fkField];
    if (!childTable) { return; }

    const childService = this._registry.get(childTable);
    const fictive = await childService.findById(fictiveChildId);
    if (!fictive) { return; }

    await this._dataTransfer.clearFkFields(childService, fictive);
    await this._dataTransfer.transferData(childService, fictive, realChildId, meta);
    await this._conflictReattribution.reattribute(fictiveChildId, realChildId);
    await childService.softDelete(fictiveChildId);
    await this._parentRedirect.redirectAll(parentService, fkField, fictiveChildId, realChildId, meta);
  }
}
