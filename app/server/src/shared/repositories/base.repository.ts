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
    await this._repository.insert(entity as QueryDeepPartialEntity<T>);
  }

  public async insertMany(entities: DeepPartial<T>[]): Promise<void> {
    await this._repository.insert(entities as QueryDeepPartialEntity<T>[]);
  }

  public async softDelete(id: TId): Promise<void> {
    await this._repository.softDelete(id as string | number);
  }
}
