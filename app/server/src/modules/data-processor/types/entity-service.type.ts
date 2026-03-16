import { BaseEntity } from '../../../shared/entities/base.entity';

export type EntityService<TData extends { id: string }> = {
  tableName: string;
  findById(id: string): Promise<(BaseEntity & Record<string, unknown>) | null>;
  insert(data: TData, source: string, notes: string | null): Promise<void>;
  update(
    id: string,
    fields: Record<string, unknown>,
    sourceUpdates: Record<string, string>,
    existingSource: Record<string, string | null> | null,
    notesUpdates: Record<string, string | null>,
    existingNotes: Record<string, string | null> | null,
  ): Promise<void>;
};
