import { Injectable } from '@nestjs/common';
import { ConflictRepository } from '../conflict.repository';
import { ConflictListResponse } from '../types/conflict-list-response.type';

@Injectable()
export class ConflictListService {
  public constructor(private readonly _conflictRepository: ConflictRepository) {}

  public async countOpen(): Promise<number> {
    return this._conflictRepository.countOpenGroups();
  }

  public async getOpenGroups(page: number, limit: number, tableName?: string, entityId?: string, conflictIds?: number[]): Promise<ConflictListResponse> {
    return this._conflictRepository.findOpenGroups((page - 1) * limit, limit, tableName, entityId, conflictIds);
  }
}
