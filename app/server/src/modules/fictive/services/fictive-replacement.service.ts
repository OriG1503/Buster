import { Injectable } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
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
    private readonly _logger: LoggerService,
  ) {}

  /**
   * Path B — triggered when inserting a new real entity that wants to own a FK child
   * already owned by a fictive entity in the same table.
   *
   * Runs before the new owner is inserted, so the parent redirect is intentionally omitted —
   * the new owner is not yet in the DB and an immediate FK redirect would violate constraints.
   * The parent redirect is handled by replaceChild when the parent entity row is processed.
   *
   * Steps: clear fictive's FK children → transfer data → reattribute conflicts → soft-delete fictive.
   */
  public async replaceOwner(
    ownerTable: string,
    fictiveOwnerId: string,
    newOwnerId: string,
    meta: RowMeta,
  ): Promise<void> {
    this._logger.info(
      `FictiveReplacementService.replaceOwner — table "${ownerTable}", fictive "${fictiveOwnerId}" → real "${newOwnerId}"`,
      'app-workflow',
    );
    const ownerService = this._registry.get(ownerTable);
    const fictive = await ownerService.findById(fictiveOwnerId);
    if (!fictive) {
      this._logger.warn(
        `FictiveReplacementService.replaceOwner — fictive "${ownerTable}/${fictiveOwnerId}" not found, skipping`,
        'app-workflow',
      );
      return;
    }

    await this._dataTransfer.clearFkFields(ownerService, fictive);
    await this._dataTransfer.transferData(ownerService, fictive, newOwnerId, meta);
    await this._conflictReattribution.reattribute(fictiveOwnerId, newOwnerId);
    await ownerService.softDelete(fictiveOwnerId);
    this._logger.info(
      `FictiveReplacementService.replaceOwner — fictive "${ownerTable}/${fictiveOwnerId}" soft-deleted, data transferred to "${newOwnerId}"`,
      'app-workflow',
    );
  }

  /**
   * Path A — triggered when an entity's FK is switching from a fictive child to a real one.
   *
   * The fictive may have already been soft-deleted by replaceOwner (Path B) if the real child
   * was inserted in the same upload. In that case the data steps are skipped but the parent
   * redirect still runs — the parent entity still holds the old fictive FK value and must be
   * updated to point at the real child (which now exists in the DB).
   *
   * Steps: if fictive exists — clear FK children → transfer data → reattribute conflicts → soft-delete.
   *        Always: redirect parent FKs to real entity.
   */
  public async replaceChild(
    parentService: EntityService<{ id: string }>,
    fkField: string,
    fictiveChildId: string,
    realChildId: string,
    meta: RowMeta,
  ): Promise<void> {
    this._logger.info(
      `FictiveReplacementService.replaceChild — parent "${parentService.tableName}.${fkField}", fictive child "${fictiveChildId}" → real "${realChildId}"`,
      'app-workflow',
    );
    const childTable = FK_FIELD_TO_TABLE[fkField];
    if (!childTable) {
      this._logger.warn(
        `FictiveReplacementService.replaceChild — no child table mapped for fkField "${fkField}", skipping`,
        'app-workflow',
      );
      return;
    }

    const childService = this._registry.get(childTable);
    const fictive = await childService.findById(fictiveChildId);

    if (fictive) {
      this._logger.debug(
        `FictiveReplacementService.replaceChild — fictive "${childTable}/${fictiveChildId}" found, transferring data to real "${realChildId}"`,
        'app-workflow',
      );
      await this._dataTransfer.clearFkFields(childService, fictive);
      await this._dataTransfer.transferData(childService, fictive, realChildId, meta);
      await this._conflictReattribution.reattribute(fictiveChildId, realChildId);
      await childService.softDelete(fictiveChildId);
    } else {
      this._logger.debug(
        `FictiveReplacementService.replaceChild — fictive "${childTable}/${fictiveChildId}" already removed; only redirecting parents`,
        'app-workflow',
      );
    }

    await this._parentRedirect.redirectAll(parentService, fkField, fictiveChildId, realChildId, meta);
  }
}
