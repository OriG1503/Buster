import { FindOptionsWhere } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { BaseConflictEntity } from './base-conflict.entity';

export abstract class BaseConflictRepository<T extends BaseConflictEntity> extends BaseRepository<T, number> {
  protected async _markResolved(
    where: FindOptionsWhere<T>,
    conflictResolver: string | null,
    resolutionNotes: string | null,
  ): Promise<void> {
    await this._repository.update(where as any, { isSolved: true, conflictResolver, resolutionNotes } as any);
  }
}
