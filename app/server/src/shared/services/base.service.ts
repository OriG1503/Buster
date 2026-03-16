import { DeepPartial } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseEntity } from '../entities/base.entity';
import { BaseRepository } from '../repositories/base.repository';

export abstract class BaseService<T extends BaseEntity, TInsertData extends { id: string }> {
  public abstract readonly tableName: string;

  public constructor(protected readonly _repository: BaseRepository<T>) {}

  public findById(id: string): Promise<T | null> {
    return this._repository.findById(id);
  }

  public async insert(data: TInsertData, source: string, notes: string | null): Promise<void> {
    const { id, ...fields } = data as { id: string } & Record<string, unknown>;
    const buildTracking = (value: string | null): Record<string, string | null> => ({
      id: value,
      ...Object.fromEntries(
        Object.entries(fields).map(([key, val]) => [key, val !== null && val !== undefined ? value : null]),
      ),
    });
    const sourceTracking = buildTracking(source);
    const notesTracking = buildTracking(notes);
    await this._repository.insert({ id, ...fields, source: sourceTracking, notes: notesTracking } as DeepPartial<T>);
  }

  public async update(
    id: string,
    fields: Record<string, unknown>,
    sourceUpdates: Record<string, string>,
    existingSource: Record<string, string | null> | null,
    notesUpdates: Record<string, string | null>,
    existingNotes: Record<string, string | null> | null,
  ): Promise<void> {
    const mergedSource = { ...(existingSource ?? {}), ...sourceUpdates };
    const mergedNotes = { ...(existingNotes ?? {}), ...notesUpdates };
    await this._repository.update(
      id,
      { ...fields, source: mergedSource, notes: mergedNotes } as unknown as QueryDeepPartialEntity<T>,
    );
  }
}
