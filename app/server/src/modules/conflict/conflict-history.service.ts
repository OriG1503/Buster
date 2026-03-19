import { Injectable, NotFoundException } from '@nestjs/common';

import { BaseEntity } from '../../shared/entities/base.entity';
import { EntityServiceRegistry } from '../../shared/services/entity-service-registry.service';
import { ConflictRepository } from './conflict.repository';
import { ConflictHistoryEntry, ConflictHistoryResponse } from './types/conflict-history-response.type';

@Injectable()
export class ConflictHistoryService {
  public constructor(
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async getHistory(tableName: string, entityId: string, columnName: string): Promise<ConflictHistoryResponse> {
    const conflicts = await this._conflictRepository.findAllByGroup(tableName, entityId, columnName);

    if (conflicts.length === 0) {
      throw new NotFoundException(`No resolved conflict history for ${tableName}/${entityId}/${columnName}`);
    }

    const entity = (await this._registry.get(tableName).findById(entityId)) as (BaseEntity & Record<string, unknown>) | null;
    const currentValue = entity ? String(entity[columnName] ?? '') : null;

    // Build a map of unique values, preserving insertion order (chronological).
    const entryMap = new Map<string | null, ConflictHistoryEntry>();

    // The oldest conflict's oldValue is the original value before any conflict was detected.
    const earliest = conflicts[0];
    const originalKey = earliest.oldValue ?? null;
    entryMap.set(originalKey, {
      value: earliest.oldValue,
      source: earliest.oldSource,
      createdAt: entity?.createdAt instanceof Date ? entity.createdAt.toISOString() : null,
      isWinner: currentValue !== null && currentValue === earliest.oldValue,
    });

    // Each conflict's newValue is a competing value that was uploaded at conflict.createdAt.
    conflicts.forEach((conflict) => {
      const key = conflict.newValue ?? null;
      if (!entryMap.has(key)) {
        entryMap.set(key, {
          value: conflict.newValue,
          source: conflict.newSource,
          createdAt: conflict.createdAt instanceof Date ? conflict.createdAt.toISOString() : null,
          isWinner: currentValue !== null && currentValue === conflict.newValue,
        });
      }
    });

    // Resolver metadata comes from the most recently resolved conflict.
    const lastResolved = conflicts[conflicts.length - 1];

    return {
      entries: [...entryMap.values()],
      resolverName: lastResolved.conflictResolver,
      resolutionDate: lastResolved.updatedAt instanceof Date ? lastResolved.updatedAt.toISOString() : null,
      resolutionNotes: lastResolved.resolutionNotes,
    };
  }
}
