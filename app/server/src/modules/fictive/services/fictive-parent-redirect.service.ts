import { Injectable } from '@nestjs/common';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityService } from '../../../shared/types/entity-service.type';
import { RowMeta } from '../types/row-meta.type';

@Injectable()
export class FictiveParentRedirectService {
  /** Updates all entities pointing to the fictive FK value to point to the real entity instead. */
  public async redirectAll(
    parentService: EntityService<{ id: string }>,
    fkField: string,
    fictiveId: string,
    realId: string,
    meta: RowMeta,
  ): Promise<void> {
    const parents = await parentService.findAllByFkValue(fkField, fictiveId);
    await Promise.all(parents.map((parent) => this._redirectOne(parentService, parent, fkField, realId, meta)));
  }

  private async _redirectOne(
    parentService: EntityService<{ id: string }>,
    parent: BaseEntity,
    fkField: string,
    realId: string,
    meta: RowMeta,
  ): Promise<void> {
    await parentService.update(
      parent.id as string,
      { [fkField]: realId },
      { [fkField]: meta.source },
      parent.source,
      { [fkField]: meta.notes },
      parent.notes,
      { [fkField]: meta.sourceTime },
      parent.sourceTime,
    );
  }
}
