import { FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EntityValue } from '../types/entity-value.type';

export abstract class BaseRepository<T extends { id: TId }, TId extends string | number = string> {
  public constructor(protected readonly _repository: Repository<T>) {}

  public findAll(): Promise<T[]> {
    return this._repository.find();
  }

  public findById(id: TId): Promise<T | null> {
    return this._repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      loadRelationIds: { relations: this._owningRelationNames() },
    });
  }

  public async insert(entity: Record<string, EntityValue>, orIgnore = false): Promise<void> {
    await this._repository
      .createQueryBuilder()
      .insert()
      .into(this._repository.target)
      .values(this._resolveRelationIdFields(entity as object as QueryDeepPartialEntity<T>))
      .orIgnore(orIgnore)
      .execute();
  }

  public async insertMany(entities: Record<string, EntityValue>[], orIgnore = false): Promise<TId[]> {
    const values = entities.map((entity) =>
      this._resolveRelationIdFields(entity as object as QueryDeepPartialEntity<T>),
    );
    const result = await this._repository
      .createQueryBuilder()
      .insert()
      .into(this._repository.target)
      .values(values)
      .orIgnore(orIgnore)
      .execute();
    return result.identifiers
      .filter((identifier) => identifier?.['id'] != null)
      .map((identifier) => identifier['id'] as TId);
  }

  public async update(id: TId, fields: Record<string, EntityValue>): Promise<void> {
    await this._repository.update(id, this._resolveRelationIdFields(fields as object as QueryDeepPartialEntity<T>));
  }

  public async renameId(oldId: TId, newId: TId): Promise<void> {
    const tableName = this._repository.metadata.tableName;
    await this._repository.manager.query(`UPDATE "${tableName}" SET "id" = $1 WHERE "id" = $2`, [newId, oldId]);
  }

  public async softDelete(id: TId): Promise<void> {
    await this._repository.softDelete(id);
  }

  public getColumnNames(): string[] {
    return [
      ...this._repository.metadata.columns.map((col) => col.propertyName),
      ...this._repository.metadata.relationIds.map((rid) => rid.propertyName),
    ];
  }

  /** Finds all entities where the given FK column equals the given value. */
  public findAllByFkValue(column: string, value: string): Promise<T[]> {
    const owningRelations = this._owningRelationNames();
    return this._repository
      .createQueryBuilder('e')
      .where(`e."${column}" = :value`, { value })
      .loadAllRelationIds({ relations: owningRelations })
      .getMany();
  }

  /** Finds an entity where the given FK column equals the given value, optionally excluding one id. */
  public findByFkValue(column: string, value: string, excludeId?: string): Promise<T | null> {
    const owningRelations = this._owningRelationNames();
    return this._repository
      .createQueryBuilder('e')
      .where(`e."${column}" = :value`, { value })
      .andWhere(excludeId ? `e.id != :excludeId` : '1=1', { excludeId })
      .loadAllRelationIds({ relations: owningRelations })
      .getOne();
  }

  /** Returns property names of owning-side relations (those with a physical FK column on this table). */
  private _owningRelationNames(): string[] {
    return this._repository.metadata.relations.filter((r) => r.isOwning).map((r) => r.propertyName);
  }

  /**
   * @RelationId fields (e.g. batteryId) are read-only TypeORM virtuals — they are ignored on writes.
   * This method converts them to their relation object form (e.g. { battery: { id } }) so TypeORM can persist the FK.
   */
  private _resolveRelationIdFields(fields: QueryDeepPartialEntity<T>): QueryDeepPartialEntity<T> {
    const result = { ...(fields as object as Record<string, EntityValue>) };
    this._repository.metadata.relationIds
      .filter(({ propertyName }) => propertyName in result)
      .forEach(({ propertyName, relation }) => {
        const value = result[propertyName];
        delete result[propertyName];
        result[relation.propertyName] = value != null ? { id: String(value) } : null;
      });
    return result as object as QueryDeepPartialEntity<T>;
  }
}
