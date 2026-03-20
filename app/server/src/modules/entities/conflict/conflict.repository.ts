import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { ConflictEntity } from './entities/conflict.entity';

@Injectable()
export class ConflictRepository extends BaseRepository<ConflictEntity, number> {
  public constructor(@InjectRepository(ConflictEntity) repository: Repository<ConflictEntity>) {
    super(repository);
  }

  public findByGroup(tableName: string, entityId: string, columnName: string): Promise<ConflictEntity[]> {
    return this._repository.find({ where: { tableName, entityId, columnName, isSolved: false } });
  }

  public findAllByGroup(tableName: string, entityId: string, columnName: string): Promise<ConflictEntity[]> {
    return this._repository.find({
      where: { tableName, entityId, columnName, isSolved: true },
      order: { createdAt: 'ASC' },
    });
  }

  /** Finds the most recent solved conflict in the group where newValue or oldValue matches. */
  public findResolvedByGroupValue(tableName: string, entityId: string, columnName: string, value: string): Promise<ConflictEntity | null> {
    const base = { tableName, entityId, columnName, isSolved: true };
    return this._repository.findOne({
      where: [{ ...base, newValue: value }, { ...base, oldValue: value }],
      order: { id: 'DESC' },
    });
  }

  public async findOpenGroups(
    skip: number,
    take: number,
    tableName?: string,
    entityId?: string,
    sourceFile?: string,
  ): Promise<{ tableName: string; entityId: string }[]> {
    const qb = this._repository
      .createQueryBuilder('c')
      .select('c.tableName', 'tableName')
      .addSelect('c.entityId', 'entityId')
      .where('c.isSolved = :isSolved', { isSolved: false })
      .groupBy('c.tableName')
      .addGroupBy('c.entityId')
      .orderBy('c.tableName', 'ASC')
      .addOrderBy('c.entityId', 'ASC')
      .offset(skip)
      .limit(take);
    if (tableName) {
      qb.andWhere('c.tableName = :tableName', { tableName });
    }
    if (entityId) {
      qb.andWhere('c.entityId ILIKE :entityId', { entityId: `%${entityId}%` });
    }
    if (sourceFile) {
      qb.andWhere('c.newSource ILIKE :sourceFile', { sourceFile: `%${sourceFile}%` });
    }
    return qb.getRawMany<{ tableName: string; entityId: string }>();
  }

  public async countOpenGroups(): Promise<number> {
    const rows = await this._repository
      .createQueryBuilder('c')
      .select(['c.tableName', 'c.entityId'])
      .where('c.isSolved = :isSolved', { isSolved: false })
      .groupBy('c.tableName')
      .addGroupBy('c.entityId')
      .getRawMany();
    return rows.length;
  }

  public findOpenByEntity(tableName: string, entityId: string): Promise<ConflictEntity[]> {
    return this._repository.find({ where: { tableName, entityId, isSolved: false } });
  }

  public async insertRevertConflict(data: Partial<ConflictEntity>): Promise<void> {
    await this.insert(data as Record<string, EntityValue>);
  }

  public async resolveMany(tableName: string, entityId: string, columnName: string, conflictResolver: string | null, notes: string | null): Promise<void> {
    await this._repository.update(
      { tableName, entityId, columnName, isSolved: false } as FindOptionsWhere<ConflictEntity>,
      { isSolved: true, conflictResolver, resolutionNotes: notes },
    );
  }
}
