import { Injectable } from '@nestjs/common';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { NON_TRANSFERABLE_KEYS } from '../consts/non-transferable-keys.const';
import { RowMeta } from '../types/row-meta.type';

@Injectable()
export class FictiveDataTransferService {
  /** Nulls out all FK fields on the fictive entity to free unique constraints before reassigning them. */
  public async clearFkFields(service: EntityService<{ id: string }>, fictive: BaseEntity): Promise<void> {
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
  public async transferData(service: EntityService<{ id: string }>, fictive: BaseEntity, realId: string, meta: RowMeta): Promise<void> {
    const real = await service.findById(realId);
    if (!real) { return; }

    const fictiveRecord = fictive as unknown as Record<string, EntityValue>;
    const realRecord = real as unknown as Record<string, EntityValue>;

    const transferKeys = Object.keys(fictiveRecord).filter(
      (k) => !NON_TRANSFERABLE_KEYS.has(k) && fictiveRecord[k] != null && realRecord[k] == null,
    );
    if (!transferKeys.length) { return; }

    const fields = Object.fromEntries(transferKeys.map((k) => [k, fictiveRecord[k]]));
    const sourceUpdates = Object.fromEntries(transferKeys.map((k) => [k, meta.source]));
    const notesUpdates = Object.fromEntries(transferKeys.map((k) => [k, meta.notes]));
    const sourceTimeUpdates = Object.fromEntries(transferKeys.map((k) => [k, meta.sourceTime]));

    await service.update(realId, fields, sourceUpdates, real.source, notesUpdates, real.notes, sourceTimeUpdates, real.sourceTime);
  }
}
