import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

export abstract class BaseRepository<T extends { id: TId }, TId extends string | number = string> {
  public constructor(protected readonly _repository: Repository<T>) {}

  public findAll(): Promise<T[]> {
    return this._repository.find();
  }

  public findById(id: TId): Promise<T | null> {
    return this._repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  public save(entity: DeepPartial<T>): Promise<T> {
    return this._repository.save(entity);
  }

  public saveMany(entities: DeepPartial<T>[]): Promise<T[]> {
    return this._repository.save(entities);
  }

  public async softDelete(id: TId): Promise<void> {
    await this._repository.softDelete(id as string | number);
  }

  public async hardDelete(id: TId): Promise<void> {
    await this._repository.delete(id as string | number);
  }
}
