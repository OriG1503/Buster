import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, FindOptionsWhere, Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { ValueConflictEntity } from './value-conflict/entities/value-conflict.entity';

@Injectable()
export class ValueConflictRepository extends BaseRepository<ValueConflictEntity, number> {
  public constructor(@InjectRepository(ValueConflictEntity) repository: Repository<ValueConflictEntity>) {
    super(repository);
  }

  public findByGroup(tableName: string, entityId: string, columnName: string): Promise<ValueConflictEntity[]> {
    return this._repository.find({ where: { tableName, entityId, columnName, isSolved: false } });
  }

  public findAllByGroup(tableName: string, entityId: string, columnName: string): Promise<ValueConflictEntity[]> {
    return this._repository.find({
      where: { tableName, entityId, columnName, isSolved: true },
      order: { createdAt: 'ASC' },
    });
  }

  public findMostRecentResolved(
    tableName: string,
    entityId: string,
    columnName: string,
  ): Promise<ValueConflictEntity | null> {
    return this._repository.findOne({
      where: { tableName, entityId, columnName, isSolved: true },
      order: { id: 'DESC' },
    });
  }

  /** Finds the most recent solved conflict in the group where newValue or oldValue matches. */
  public findResolvedByGroupValue(
    tableName: string,
    entityId: string,
    columnName: string,
    value: string,
  ): Promise<ValueConflictEntity | null> {
    const base = { tableName, entityId, columnName, isSolved: true };
    return this._repository.findOne({
      where: [
        { ...base, newValue: value },
        { ...base, oldValue: value },
      ],
      order: { id: 'DESC' },
    });
  }

  public async findOpenGroups(
    skip: number,
    take: number,
    tableName?: string,
    entityId?: string,
    conflictIds?: number[],
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
    if (conflictIds?.length) {
      qb.andWhere('c.id IN (:...conflictIds)', { conflictIds });
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

  public findOpenByEntity(tableName: string, entityId: string): Promise<ValueConflictEntity[]> {
    return this._repository.find({ where: { tableName, entityId, isSolved: false } });
  }

  public async findOpenIdsByData(
    conflicts: { tableName: string; entityId: string; columnName: string; newValue: string }[],
  ): Promise<number[]> {
    if (!conflicts.length) {
      return [];
    }
    const qb = this._repository
      .createQueryBuilder('c')
      .select('c.id', 'id')
      .where('c.isSolved = :isSolved', { isSolved: false })
      .andWhere(
        new Brackets((qb2) => {
          conflicts.forEach((c, i) => {
            qb2.orWhere(
              `(c.tableName = :tableName${i} AND c.entityId = :entityId${i} AND c.columnName = :columnName${i} AND c.newValue = :newValue${i})`,
              {
                [`tableName${i}`]: c.tableName,
                [`entityId${i}`]: c.entityId,
                [`columnName${i}`]: c.columnName,
                [`newValue${i}`]: c.newValue,
              },
            );
          });
        }),
      );
    const rows = await qb.getRawMany<{ id: number }>();
    return rows.map((r) => r.id);
  }

  /** Re-attributes all open conflicts referencing a fictive entity ID to the replacement real entity ID. */
  public async reattribute(fictiveId: string, realId: string): Promise<void> {
    await this._repository.update({ entityId: fictiveId, isSolved: false } as FindOptionsWhere<ValueConflictEntity>, {
      entityId: realId,
    });
  }

  public async insertRevertConflict(data: Partial<ValueConflictEntity>): Promise<void> {
    await this.insert(data as Record<string, EntityValue>);
  }

  public async resolveMany(
    tableName: string,
    entityId: string,
    columnName: string,
    conflictResolver: string | null,
    notes: string | null,
  ): Promise<void> {
    await this._repository.update(
      { tableName, entityId, columnName, isSolved: false } as FindOptionsWhere<ValueConflictEntity>,
      { isSolved: true, conflictResolver, resolutionNotes: notes },
    );
  }
}
