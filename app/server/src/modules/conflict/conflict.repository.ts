import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
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
