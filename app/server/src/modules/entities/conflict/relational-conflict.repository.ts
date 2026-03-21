import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';

@Injectable()
export class RelationalConflictRepository extends BaseRepository<RelationalConflictEntity, number> {
  public constructor(@InjectRepository(RelationalConflictEntity) repository: Repository<RelationalConflictEntity>) {
    super(repository);
  }

  public findOpenByAnchor(anchorId: string, anchorTable: string): Promise<RelationalConflictEntity[]> {
    return this._repository.find({ where: { anchorId, anchorTable, isSolved: false } });
  }

  public findById(id: number): Promise<RelationalConflictEntity | null> {
    return this._repository.findOne({ where: { id } });
  }

  public async resolve(
    id: number,
    conflictResolver: string,
    resolutionNotes: string | null,
  ): Promise<void> {
    await this._repository.update(id, {
      isSolved: true,
      conflictResolver,
      resolutionNotes,
      resolvedAt: new Date(),
    });
  }

  public async insertConflict(data: Partial<RelationalConflictEntity>): Promise<void> {
    await this.insert(data as Record<string, EntityValue>, true);
  }
}
