import { EntityValue } from './entity-value.type';
import { BaseEntity } from '../entities/base.entity';

/** Describes the public contract any entity service must satisfy — used by the registry and conflict resolver. */
export type EntityService<TData extends { id: string }> = {
  tableName: string;
  findById(id: string): Promise<BaseEntity | null>;
  getColumnNames(): string[];
  findAllByFkValue(column: string, value: string): Promise<BaseEntity[]>;
  findByFkValue(column: string, value: string, excludeId?: string): Promise<BaseEntity | null>;
  insert(data: TData, source: string, notes: string | null, sourceTime: string | null): Promise<void>;
  renameId(oldId: string, newId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  update(
    id: string,
    fields: Record<string, EntityValue>,
    sourceUpdates: Record<string, string>,
    existingSource: Record<string, string | null> | null,
    notesUpdates: Record<string, string | null>,
    existingNotes: Record<string, string | null> | null,
    sourceTimeUpdates: Record<string, string | null>,
    existingSourceTime: Record<string, string | null> | null,
  ): Promise<void>;
};
