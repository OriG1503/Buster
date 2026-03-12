import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseRepository<T extends { id: TId }, TId extends string | number = string> {
  public constructor(protected readonly _repository: Repository<T>) {}

  public findAll(): Promise<T[]> {
    return this._repository.find();
  }

  public findById(id: TId): Promise<T | null> {
    return this._repository.findOne({ where: { id } as FindOptionsWhere<T>, loadRelationIds: true });
  }

  public async insert(entity: DeepPartial<T>): Promise<void> {
    await this._repository.insert(this._resolveRelationIdFields(entity as QueryDeepPartialEntity<T>));
  }

  public async insertMany(entities: DeepPartial<T>[]): Promise<void> {
    await this._repository.insert(entities.map((e) => this._resolveRelationIdFields(e as QueryDeepPartialEntity<T>)));
  }

  public async update(id: TId, fields: QueryDeepPartialEntity<T>): Promise<void> {
    await this._repository.update(id, this._resolveRelationIdFields(fields));
  }

  private _resolveRelationIdFields(fields: QueryDeepPartialEntity<T>): QueryDeepPartialEntity<T> {
    const result = { ...(fields as Record<string, unknown>) };
    this._repository.metadata.relationIds.forEach((rid) => {
      if (!(rid.propertyName in result)) {
        return;
      }
      const value = result[rid.propertyName];
      delete result[rid.propertyName];
      result[rid.relation.propertyName] = value !== null && value !== undefined ? { id: value } : null;
    });
    return result as QueryDeepPartialEntity<T>;
  }

  public async softDelete(id: TId): Promise<void> {
    await this._repository.softDelete(id);
  }
}
