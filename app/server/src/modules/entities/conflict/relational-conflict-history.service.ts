import { Injectable, NotFoundException } from '@nestjs/common';
import { RelationalConflictRepository } from './relational-conflict.repository';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';
import {
  RelationalHistoryAnchor,
  RelationalHistoryGroup,
  RelationalHistoryOption,
  RelationalHistoryResponse,
} from './types/relational-history-response.type';

const EXCLUDED_ANCHOR_FIELDS = new Set(['source', 'notes', 'createdAt', 'updatedAt', 'deletedAt', 'id']);

@Injectable()
export class RelationalConflictHistoryService {
  public constructor(
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async getHistory(anchorTable: string, anchorId: string, relatedTable: string): Promise<RelationalHistoryResponse> {
    const conflicts = await this._relationalConflictRepository.findSolvedByAnchor(anchorTable, anchorId, relatedTable);

    if (conflicts.length === 0) {
      throw new NotFoundException(`No resolved relational conflict history for ${anchorTable}/${anchorId}`);
    }

    // Group by (conflictType, relatedTable)
    const groupMap = new Map<string, RelationalConflictEntity[]>();
    conflicts.forEach((rc) => {
      const key = `${rc.conflictType}|${rc.relatedTable}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(rc);
    });

    const groups: RelationalHistoryGroup[] = [];
    for (const [key, groupConflicts] of groupMap) {
      const [conflictType, relatedTable] = key.split('|');
      const winnerRelatedId = await this._findWinner(conflictType, relatedTable, anchorTable, anchorId);
      const options = this._mergeOptions(groupConflicts, winnerRelatedId);
      groups.push({ conflictType, relatedTable, options });
    }

    const lastResolved = conflicts.reduce((latest, rc) =>
      (rc.updatedAt as Date) > (latest.updatedAt as Date) ? rc : latest,
    );

    const anchorSnapshot = conflicts[0].snapshot?.anchor ?? {};
    const anchor: RelationalHistoryAnchor = {
      id: anchorId,
      tableName: anchorTable,
      fields: this._extractAnchorFields(anchorSnapshot),
    };

    return {
      anchor,
      groups,
      resolverName: lastResolved.conflictResolver,
      resolutionDate: lastResolved.updatedAt instanceof Date ? lastResolved.updatedAt.toISOString() : null,
      resolutionNotes: lastResolved.resolutionNotes,
    };
  }

  private async _findWinner(
    conflictType: string,
    relatedTable: string,
    anchorTable: string,
    anchorId: string,
  ): Promise<string | null> {
    if (conflictType === 'TWO_CHILDS') {
      const fkField = `${relatedTable.slice(0, -1)}Id`;
      const anchorEntity = (await this._registry.get(anchorTable).findById(anchorId)) as Record<string, unknown> | null;
      return anchorEntity ? ((anchorEntity[fkField] as string | null) ?? null) : null;
    }
    if (conflictType === 'TWO_FATHERS') {
      const fkField = Object.keys(FK_FIELD_TO_TABLE).find((k) => FK_FIELD_TO_TABLE[k] === anchorTable) ?? null;
      if (!fkField) {
        return null;
      }
      const winnerParent = (await this._registry.get(relatedTable).findByFkValue(fkField, anchorId)) as Record<
        string,
        unknown
      > | null;
      return winnerParent ? ((winnerParent['id'] as string | null) ?? null) : null;
    }
    return null;
  }

  private _mergeOptions(conflicts: RelationalConflictEntity[], winnerRelatedId: string | null): RelationalHistoryOption[] {
    const idToOption = new Map<string, RelationalHistoryOption>();
    conflicts.forEach((rc) => {
      if (!idToOption.has(rc.oldRelatedId)) {
        idToOption.set(rc.oldRelatedId, {
          id: rc.oldRelatedId,
          source: rc.oldRelatedSource,
          sourceTime: rc.oldRelatedSourceTime,
          notes: rc.oldRelatedNotes,
          isWinner: rc.oldRelatedId === winnerRelatedId,
          subtreeIds: this._extractSubtreeIds(rc.snapshot?.oldRelated ?? null),
        });
      }
      if (!idToOption.has(rc.newRelatedId)) {
        idToOption.set(rc.newRelatedId, {
          id: rc.newRelatedId,
          source: rc.newRelatedSource,
          sourceTime: rc.newRelatedSourceTime,
          notes: rc.newRelatedNotes,
          isWinner: rc.newRelatedId === winnerRelatedId,
          subtreeIds: this._extractSubtreeIds(rc.snapshot?.newRelated ?? null),
        });
      }
    });
    return [...idToOption.values()];
  }

  private _extractAnchorFields(data: Record<string, unknown>): Record<string, string | null> {
    return Object.entries(data)
      .filter(([key, val]) => !EXCLUDED_ANCHOR_FIELDS.has(key) && (val === null || typeof val !== 'object'))
      .reduce<Record<string, string | null>>((acc, [key, val]) => {
        acc[key] = val !== null && val !== undefined ? String(val) : null;
        return acc;
      }, {});
  }

  private _extractSubtreeIds(entityData: Record<string, unknown> | null): Record<string, string | null> {
    if (!entityData) {
      return {};
    }
    return Object.entries(entityData)
      .filter(([key]) => key.endsWith('Id') && key !== 'id')
      .reduce<Record<string, string | null>>((acc, [key, val]) => {
        acc[key] = typeof val === 'string' ? val : null;
        return acc;
      }, {});
  }
}
