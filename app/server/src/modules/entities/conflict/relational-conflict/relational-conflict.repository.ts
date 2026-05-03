import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { EntityValue } from '../../../../shared/types/entity-value.type';
import { BaseConflictRepository } from '../base-conflict.repository';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';

@Injectable()
export class RelationalConflictRepository extends BaseConflictRepository<RelationalConflictEntity> {
  public constructor(@InjectRepository(RelationalConflictEntity) repository: Repository<RelationalConflictEntity>) {
    super(repository);
  }

  public findOpenByAnchor(anchorId: string, anchorTable: string): Promise<RelationalConflictEntity[]> {
    return this._repository.find({ where: { anchorId, anchorTable, isSolved: false } });
  }

  public async resolve(id: number, conflictResolver: string, resolutionNotes: string | null): Promise<void> {
    await this._markResolved({ id } as FindOptionsWhere<RelationalConflictEntity>, conflictResolver, resolutionNotes);
  }

  public findSolvedByAnchor(
    anchorTable: string,
    anchorId: string,
    relatedTable: string,
  ): Promise<RelationalConflictEntity[]> {
    return this._repository.find({ where: { anchorTable, anchorId, relatedTable, isSolved: true } });
  }

  /**
   * Re-attributes all open relational conflicts referencing a fictive entity ID to the replacement real entity ID.
   * Updates anchorId, oldRelatedId, and newRelatedId where they match the fictive ID.
   */
  public async reattribute(fictiveId: string, realId: string): Promise<void> {
    await Promise.all([
      this._repository.update({ anchorId: fictiveId, isSolved: false } as FindOptionsWhere<RelationalConflictEntity>, {
        anchorId: realId,
      }),
      this._repository.update(
        { oldRelatedId: fictiveId, isSolved: false } as FindOptionsWhere<RelationalConflictEntity>,
        { oldRelatedId: realId },
      ),
      this._repository.update(
        { newRelatedId: fictiveId, isSolved: false } as FindOptionsWhere<RelationalConflictEntity>,
        { newRelatedId: realId },
      ),
    ]);
  }

  /** Inserts a new conflict. Returns the new conflict's ID, or null if it already existed (unique violation ignored). */
  public async insertConflict(data: Partial<RelationalConflictEntity>): Promise<number | null> {
    const ids = await this.insertMany([data as Record<string, EntityValue>], true);
    return ids.length > 0 ? ids[0] : null;
  }
}
