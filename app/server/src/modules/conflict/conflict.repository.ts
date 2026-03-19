import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { EntityValue } from '../../shared/types/entity-value.type';
import { ConflictEntity } from './entities/conflict.entity';

@Injectable()
export class ConflictRepository extends BaseRepository<ConflictEntity, number> {
  public constructor(
    @InjectRepository(ConflictEntity)
    repository: Repository<ConflictEntity>,
  ) {
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

  public findResolvedByGroupValue(
    tableName: string,
    entityId: string,
    columnName: string,
    value: string,
  ): Promise<ConflictEntity | null> {
    return this._repository
      .createQueryBuilder('conflict')
      .where('conflict.tableName = :tableName', { tableName })
      .andWhere('conflict.entityId = :entityId', { entityId })
      .andWhere('conflict.columnName = :columnName', { columnName })
      .andWhere('conflict.isSolved = true')
      .andWhere('(conflict.newValue = :value OR conflict.oldValue = :value)', { value })
      .orderBy('conflict.id', 'DESC')
      .getOne();
  }

  public async insertRevertConflict(data: Partial<ConflictEntity>): Promise<void> {
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
      { tableName, entityId, columnName, isSolved: false } as FindOptionsWhere<ConflictEntity>,
      { isSolved: true, conflictResolver, resolutionNotes: notes },
    );
  }
}
