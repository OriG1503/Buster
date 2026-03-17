import { EntityValue } from '../../../shared/types/entity-value.type';
import { BaseEntity } from '../../../shared/entities/base.entity';

export type EntityService<TData extends { id: string }> = {
  tableName: string;
  findById(id: string): Promise<BaseEntity | null>;
  insert(data: TData, source: string, notes: string | null): Promise<void>;
  update(
    id: string,
    fields: Record<string, EntityValue>,
    sourceUpdates: Record<string, string>,
    existingSource: Record<string, string | null> | null,
    notesUpdates: Record<string, string | null>,
    existingNotes: Record<string, string | null> | null,
  ): Promise<void>;
};
