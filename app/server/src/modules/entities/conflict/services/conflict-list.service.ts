import { Injectable } from '@nestjs/common';
import { ValueConflictRepository } from '../conflict.repository';
import { ConflictListResponse } from '../types/conflict-list-response.type';

@Injectable()
export class ValueConflictListService {
  public constructor(private readonly _valueConflictRepository: ValueConflictRepository) {}

  public async countOpen(): Promise<number> {
    return this._valueConflictRepository.countOpenGroups();
  }

  public async getOpenGroups(page: number, limit: number, tableName?: string, entityId?: string, conflictIds?: number[]): Promise<ConflictListResponse> {
    return this._valueConflictRepository.findOpenGroups((page - 1) * limit, limit, tableName, entityId, conflictIds);
  }
}
