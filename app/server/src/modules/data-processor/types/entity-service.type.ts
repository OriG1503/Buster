import { BaseEntity } from '../../../shared/entities/base.entity';

export type EntityService<TData extends { id: string }> = {
  findById(id: string): Promise<(BaseEntity & Record<string, unknown>) | null>;
  insert(data: TData, fileSource: string): Promise<void>;
  update(
    id: string,
    fields: Record<string, unknown>,
    sourceUpdates: Record<string, string>,
    existingSource: Record<string, string | null> | null,
  ): Promise<void>;
};
