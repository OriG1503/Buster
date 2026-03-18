import { EntityValue } from '../types/entity-value.type';
import { BaseEntity } from '../entities/base.entity';
import { BaseRepository } from '../repositories/base.repository';

export abstract class BaseService<T extends BaseEntity, TInsertData extends { id: string } & Record<string, EntityValue>> {
  public abstract readonly tableName: string;

  public constructor(protected readonly _repository: BaseRepository<T>) {}

  public findById(id: string): Promise<T | null> {
    return this._repository.findById(id);
  }

  public async insert(data: TInsertData, source: string, notes: string | null): Promise<void> {
    const { id, ...fields } = data;
    const buildTracking = (value: string | null): Record<string, string | null> => ({
      id: value,
      ...Object.fromEntries(
        Object.entries(fields).map(([key, val]) => [key, val !== null && val !== undefined ? value : null]),
      ),
    });
    await this._repository.insert({ id, ...fields, source: buildTracking(source), notes: buildTracking(notes) });
  }

  public renameId(oldId: string, newId: string): Promise<void> {
    return this._repository.renameId(oldId, newId);
  }

  public softDelete(id: string): Promise<void> {
    return this._repository.softDelete(id);
  }

  public async update(
    id: string,
    fields: Record<string, EntityValue>,
    sourceUpdates: Record<string, string>,
    existingSource: Record<string, string | null> | null,
    notesUpdates: Record<string, string | null>,
    existingNotes: Record<string, string | null> | null,
  ): Promise<void> {
    await this._repository.update(id, {
      ...fields,
      source: { ...(existingSource ?? {}), ...sourceUpdates },
      notes: { ...(existingNotes ?? {}), ...notesUpdates },
    });
  }
}
