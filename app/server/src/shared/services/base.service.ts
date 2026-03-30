import { EntityValue } from '../types/entity-value.type';
import { BaseEntity } from '../entities/base.entity';
import { BaseRepository } from '../repositories/base.repository';

export abstract class BaseService<T extends BaseEntity, TInsertData extends { id: string } & Record<string, EntityValue>> {
  public abstract readonly tableName: string;

  public constructor(protected readonly _repository: BaseRepository<T>) {}

  public findById(id: string): Promise<T | null> {
    return this._repository.findById(id);
  }

  public getColumnNames(): string[] {
    return this._repository.getColumnNames();
  }

  public findAllByFkValue(column: string, value: string): Promise<T[]> {
    return this._repository.findAllByFkValue(column, value);
  }

  public findByFkValue(column: string, value: string, excludeId?: string): Promise<T | null> {
    return this._repository.findByFkValue(column, value, excludeId);
  }

  public async insert(data: TInsertData, source: string, notes: string | null, sourceTime: string | null): Promise<void> {
    const { id, ...fields } = data;
    await this._repository.insert({
      id,
      ...fields,
      source: this._buildFieldTracking(fields, source),
      notes: this._buildFieldTracking(fields, notes),
      sourceTime: this._buildFieldTracking(fields, sourceTime),
    });
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
    sourceTimeUpdates: Record<string, string | null>,
    existingSourceTime: Record<string, string | null> | null,
  ): Promise<void> {
    await this._repository.update(id, {
      ...fields,
      source: { ...(existingSource ?? {}), ...sourceUpdates },
      notes: { ...(existingNotes ?? {}), ...notesUpdates },
      sourceTime: { ...(existingSourceTime ?? {}), ...sourceTimeUpdates },
    });
  }

  /**
   * Builds a per-field tracking map: each field gets the tracking value if it has data, otherwise null.
   * This records which source/notes value applies to each specific field in the row.
   */
  private _buildFieldTracking(fields: Record<string, EntityValue>, trackingValue: string | null): Record<string, string | null> {
    return {
      id: trackingValue,
      ...Object.fromEntries(
        Object.entries(fields).map(([fieldName, fieldValue]) => [fieldName, fieldValue != null ? trackingValue : null]),
      ),
    };
  }
}
