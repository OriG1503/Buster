import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityServiceRegistry } from '../../../../../shared/services/entity-service-registry.service';
import { CrossEntityConflictRepository } from '../cross-entity-conflict.repository';
import { CrossEntityConflictEntity } from '../entities/cross-entity-conflict.entity';
import { CrossEntityHistoryEntry, CrossEntityHistoryResponse } from '../types/cross-entity-history-response.type';

@Injectable()
export class CrossEntityConflictHistoryService {
  public constructor(
    private readonly _crossEntityConflictRepository: CrossEntityConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async getHistory(
    tableName: string,
    entityId: string,
    columnName: string,
  ): Promise<CrossEntityHistoryResponse> {
    const isRobot = tableName === 'robots';
    const conflicts = isRobot
      ? await this._crossEntityConflictRepository.findSolvedByRobotField(entityId, columnName)
      : await this._crossEntityConflictRepository.findSolvedByWiringField(entityId, columnName);

    if (conflicts.length === 0) {
      throw new NotFoundException(
        `No resolved cross-entity conflict history for ${tableName}/${entityId}/${columnName}`,
      );
    }

    const entity = (await this._registry.get(tableName).findById(entityId)) as Record<string, unknown> | null;
    const currentValue = entity ? String(entity[columnName] ?? '') : null;

    const entries = isRobot
      ? this._buildRobotEntries(entityId, conflicts, currentValue)
      : this._buildWiringEntries(entityId, conflicts, currentValue);

    const lastConflict = conflicts[conflicts.length - 1];
    return {
      fieldName: columnName,
      entries,
      resolverName: lastConflict.conflictResolver,
      resolutionDate: lastConflict.updatedAt instanceof Date ? lastConflict.updatedAt.toISOString() : null,
      resolutionNotes: lastConflict.resolutionNotes,
    };
  }

  private _buildRobotEntries(
    robotId: string,
    conflicts: CrossEntityConflictEntity[],
    currentValue: string | null,
  ): CrossEntityHistoryEntry[] {
    const entryMap = new Map<string, CrossEntityHistoryEntry>();

    const first = conflicts[0];
    const robotKey = `robots__${robotId}__${first.robotValue ?? ''}`;
    if (!entryMap.has(robotKey)) {
      entryMap.set(robotKey, {
        entityId: robotId,
        entityTable: 'robots',
        value: first.robotValue,
        source: first.robotSource,
        notes: first.robotNotes,
        sourceTime: first.robotSourceTime,
        isWinner: currentValue !== null && currentValue === first.robotValue,
      });
    }

    conflicts.forEach((conflict) => {
      const key = `wirings__${conflict.wiringId}__${conflict.wiringValue ?? ''}`;
      if (!entryMap.has(key)) {
        entryMap.set(key, {
          entityId: conflict.wiringId,
          entityTable: 'wirings',
          value: conflict.wiringValue,
          source: conflict.wiringSource,
          notes: conflict.wiringNotes,
          sourceTime: conflict.wiringSourceTime,
          isWinner: currentValue !== null && currentValue === conflict.wiringValue,
        });
      }
    });

    return [...entryMap.values()];
  }

  private _buildWiringEntries(
    wiringId: string,
    conflicts: CrossEntityConflictEntity[],
    currentValue: string | null,
  ): CrossEntityHistoryEntry[] {
    const entryMap = new Map<string, CrossEntityHistoryEntry>();

    const first = conflicts[0];
    const wiringKey = `wirings__${wiringId}__${first.wiringValue ?? ''}`;
    if (!entryMap.has(wiringKey)) {
      entryMap.set(wiringKey, {
        entityId: wiringId,
        entityTable: 'wirings',
        value: first.wiringValue,
        source: first.wiringSource,
        notes: first.wiringNotes,
        sourceTime: first.wiringSourceTime,
        isWinner: currentValue !== null && currentValue === first.wiringValue,
      });
    }

    conflicts.forEach((conflict) => {
      const key = `robots__${conflict.robotId}__${conflict.robotValue ?? ''}`;
      if (!entryMap.has(key)) {
        entryMap.set(key, {
          entityId: conflict.robotId,
          entityTable: 'robots',
          value: conflict.robotValue,
          source: conflict.robotSource,
          notes: conflict.robotNotes,
          sourceTime: conflict.robotSourceTime,
          isWinner: currentValue !== null && currentValue === conflict.robotValue,
        });
      }
    });

    return [...entryMap.values()];
  }
}
