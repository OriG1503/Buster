import { FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EntityValue } from '../types/entity-value.type';

export abstract class BaseRepository<T extends { id: TId }, TId extends string | number = string> {
  public constructor(protected readonly _repository: Repository<T>) {}

  public findAll(): Promise<T[]> {
    return this._repository.find();
  }

  public findById(id: TId): Promise<T | null> {
    return this._repository.findOne({ where: { id } as FindOptionsWhere<T>, loadRelationIds: true });
  }

  public async insert(entity: Record<string, EntityValue>, orIgnore = false): Promise<void> {
    await this._repository.createQueryBuilder().insert().into(this._repository.target).values(this._resolveRelationIdFields(entity as object as QueryDeepPartialEntity<T>)).orIgnore(orIgnore).execute();
  }

  public async insertMany(entities: Record<string, EntityValue>[], orIgnore = false): Promise<void> {
    await this._repository
      .createQueryBuilder()
      .insert()
      .into(this._repository.target)
      .values(entities.map((entity) => this._resolveRelationIdFields(entity as object as QueryDeepPartialEntity<T>)))
      .orIgnore(orIgnore)
      .execute();
  }

  public async update(id: TId, fields: Record<string, EntityValue>): Promise<void> {
    await this._repository.update(id, this._resolveRelationIdFields(fields as object as QueryDeepPartialEntity<T>));
  }

  private _resolveRelationIdFields(fields: QueryDeepPartialEntity<T>): QueryDeepPartialEntity<T> {
    const result: Record<string, EntityValue> = { ...(fields as object as Record<string, EntityValue>) };
    this._repository.metadata.relationIds.forEach((rid) => {
      if (!(rid.propertyName in result)) {
        return;
      }
      const value = result[rid.propertyName];
      delete result[rid.propertyName];
      result[rid.relation.propertyName] = value !== null && value !== undefined ? { id: String(value) } : null;
    });
    return result as object as QueryDeepPartialEntity<T>;
  }

  public async renameId(oldId: TId, newId: TId): Promise<void> {
    const tableName = this._repository.metadata.tableName;
    await this._repository.manager.query(`UPDATE "${tableName}" SET "id" = $1 WHERE "id" = $2`, [newId, oldId]);
  }

  public async softDelete(id: TId): Promise<void> {
    await this._repository.softDelete(id);
  }
}
