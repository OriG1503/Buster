import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../shared/services/logger/logger.service';
import { ValueConflictEntityDetailService } from '../value-conflict/services/value-conflict-entity-detail.service';
import { RelationalConflictRepository } from '../relational-conflict/relational-conflict.repository';
import { CrossEntityConflictRepository } from '../cross-entity-conflict/cross-entity-conflict.repository';
import {
  ConflictColumnDetail,
  ConflictEntityDetailResponse,
  CrossEntityConflictEntry,
  RelationalConflictDetail,
  RelationalConflictOption,
  TwoFathersConflictDetail,
} from '../types/conflict-entity-detail-response.type';
import { RelationalConflictEntity } from '../relational-conflict/entities/relational-conflict.entity';
import { CrossEntityConflictEntity } from '../cross-entity-conflict/entities/cross-entity-conflict.entity';
import { FK_FIELD_TO_TABLE } from '../../../../shared/consts/fk-field-to-table.const';
import { RELATIONAL_CONFLICT_TYPE } from '../relational-conflict/consts/relational-conflict-type.const';
import { CROSS_ENTITY_FIELDS } from '../cross-entity-conflict/consts/cross-entity-fields.const';

const FK_ID_SUFFIX = 'Id';

@Injectable()
export class ConflictEntityDetailService {
  public constructor(
    private readonly _valueConflictEntityDetailService: ValueConflictEntityDetailService,
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _crossEntityConflictRepository: CrossEntityConflictRepository,
    private readonly _logger: LoggerService,
  ) {}

  public async getEntityDetail(tableName: string, entityId: string): Promise<ConflictEntityDetailResponse> {
    this._logger.info(
      `ConflictEntityDetailService.getEntityDetail — fetching detail for "${tableName}/${entityId}"`,
      'app-workflow',
    );
    const [columns, relationalConflicts, crossEntityConflicts] = await Promise.all([
      this._valueConflictEntityDetailService.getEntityDetail(tableName, entityId),
      this._relationalConflictRepository.findOpenByAnchor(entityId, tableName),
      this._fetchCrossEntityConflicts(tableName, entityId),
    ]);
    this._logger.debug(
      `ConflictEntityDetailService.getEntityDetail — "${tableName}/${entityId}" — columns=${columns.length}, relational=${relationalConflicts.length}, crossEntity=${crossEntityConflicts.length}`,
      'app-workflow',
    );

    const twoChilds = relationalConflicts.filter((rc) => rc.conflictType === RELATIONAL_CONFLICT_TYPE.TWO_CHILDS);
    const twoFathers = relationalConflicts.filter((rc) => rc.conflictType === RELATIONAL_CONFLICT_TYPE.TWO_FATHERS);

    const twoChildsByFkField = this._groupByFkField(twoChilds);
    const crossEntityByField = this._groupCrossEntityByField(crossEntityConflicts, tableName, entityId);

    const enrichedColumns = columns.map((col): ConflictColumnDetail => {
      const relGroup = twoChildsByFkField[col.columnName];
      const crossGroup = crossEntityByField[col.columnName] ?? [];
      const isConflicted = col.isConflicted || crossGroup.length > 0;
      return {
        ...col,
        isConflicted,
        crossEntityConflicts: crossGroup,
        ...(relGroup ? { relationalConflict: this._buildRelationalDetail(relGroup) } : {}),
      };
    });

    const twoFathersConflict = twoFathers.length > 0 ? this._buildTwoFathersDetail(twoFathers) : null;

    return { columns: enrichedColumns, twoFathersConflict };
  }

  /** Returns cross-entity conflicts keyed by fieldName, with the "other entity" perspective. */
  private _groupCrossEntityByField(
    conflicts: CrossEntityConflictEntity[],
    viewingTable: string,
    viewingEntityId: string,
  ): Record<string, CrossEntityConflictEntry[]> {
    return conflicts.reduce<Record<string, CrossEntityConflictEntry[]>>((acc, conflict) => {
      if (!CROSS_ENTITY_FIELDS.includes(conflict.fieldName as (typeof CROSS_ENTITY_FIELDS)[number])) {
        return acc;
      }
      const isViewingRobot = viewingTable === 'robots' && conflict.robotId === viewingEntityId;
      const entry: CrossEntityConflictEntry = isViewingRobot
        ? {
            conflictId: conflict.id,
            entityId: conflict.wiringId,
            entityTable: 'wirings',
            value: conflict.wiringValue,
            source: conflict.wiringSource,
            notes: conflict.wiringNotes,
            sourceTime: conflict.wiringSourceTime,
          }
        : {
            conflictId: conflict.id,
            entityId: conflict.robotId,
            entityTable: 'robots',
            value: conflict.robotValue,
            source: conflict.robotSource,
            notes: conflict.robotNotes,
            sourceTime: conflict.robotSourceTime,
          };
      acc[conflict.fieldName] = [...(acc[conflict.fieldName] ?? []), entry];
      return acc;
    }, {});
  }

  /** Loads open cross-entity conflicts relevant to this entity (as robot or as wiring). */
  private _fetchCrossEntityConflicts(tableName: string, entityId: string): Promise<CrossEntityConflictEntity[]> {
    if (tableName === 'robots') {
      return this._crossEntityConflictRepository.findOpenByRobot(entityId);
    }
    if (tableName === 'wirings') {
      return this._crossEntityConflictRepository.findOpenByWiring(entityId);
    }
    return Promise.resolve([]);
  }

  private _groupByFkField(conflicts: RelationalConflictEntity[]): Record<string, RelationalConflictEntity[]> {
    return conflicts.reduce<Record<string, RelationalConflictEntity[]>>((acc, rc) => {
      const fkField = Object.keys(FK_FIELD_TO_TABLE).find((k) => FK_FIELD_TO_TABLE[k] === rc.relatedTable);
      if (!fkField) {
        return acc;
      }
      if (!acc[fkField]) {
        acc[fkField] = [];
      }
      acc[fkField].push(rc);
      return acc;
    }, {});
  }

  private _buildRelationalDetail(conflicts: RelationalConflictEntity[]): RelationalConflictDetail {
    const first = conflicts[0];
    return {
      conflictIds: conflicts.map((rc) => rc.id),
      conflictType: first.conflictType,
      relatedTable: first.relatedTable,
      options: this._mergeOptions(conflicts),
    };
  }

  private _buildTwoFathersDetail(conflicts: RelationalConflictEntity[]): TwoFathersConflictDetail {
    const first = conflicts[0];
    return {
      conflictIds: conflicts.map((rc) => rc.id),
      relatedTable: first.relatedTable,
      options: this._mergeOptions(conflicts),
    };
  }

  private _mergeOptions(conflicts: RelationalConflictEntity[]): RelationalConflictOption[] {
    const idToOption = new Map<string, RelationalConflictOption>();
    conflicts.forEach((rc) => {
      if (!idToOption.has(rc.oldRelatedId)) {
        idToOption.set(rc.oldRelatedId, {
          id: rc.oldRelatedId,
          source: rc.oldRelatedSource,
          childData: this._extractChildData(rc.snapshot?.oldRelated ?? null),
        });
      }
      if (!idToOption.has(rc.newRelatedId)) {
        idToOption.set(rc.newRelatedId, {
          id: rc.newRelatedId,
          source: rc.newRelatedSource,
          childData: this._extractChildData(rc.snapshot?.newRelated ?? null),
        });
      }
    });
    return Array.from(idToOption.values());
  }

  private _extractChildData(entityData: Record<string, unknown> | null): Record<string, string | null> {
    if (!entityData) {
      return {};
    }
    return Object.entries(entityData)
      .filter(([key]) => key.endsWith(FK_ID_SUFFIX) && key !== 'id')
      .reduce<Record<string, string | null>>((acc, [key, val]) => {
        acc[key] = typeof val === 'string' ? val : null;
        return acc;
      }, {});
  }
}
