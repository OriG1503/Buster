import { Injectable } from '@nestjs/common';
import { ValueConflictEntityDetailService } from './value-conflict-entity-detail.service';
import { RelationalConflictRepository } from '../relational-conflict.repository';
import {
  ConflictEntityDetailResponse,
  RelationalConflictDetail,
  RelationalConflictOption,
  TwoFathersConflictDetail,
} from '../types/conflict-entity-detail-response.type';
import { RelationalConflictEntity } from '../entities/relational-conflict.entity';
import { FK_FIELD_TO_TABLE } from '../../../../shared/consts/fk-field-to-table.const';
import { RELATIONAL_CONFLICT_TYPE } from '../consts/relational-conflict-type.const';

const FK_ID_SUFFIX = 'Id';

@Injectable()
export class ConflictEntityDetailService {
  public constructor(
    private readonly _valueConflictEntityDetailService: ValueConflictEntityDetailService,
    private readonly _relationalConflictRepository: RelationalConflictRepository,
  ) {}

  public async getEntityDetail(tableName: string, entityId: string): Promise<ConflictEntityDetailResponse> {
    const [columns, relationalConflicts] = await Promise.all([
      this._valueConflictEntityDetailService.getEntityDetail(tableName, entityId),
      this._relationalConflictRepository.findOpenByAnchor(entityId, tableName),
    ]);

    const twoChilds = relationalConflicts.filter((rc) => rc.conflictType === RELATIONAL_CONFLICT_TYPE.TWO_CHILDS);
    const twoFathers = relationalConflicts.filter((rc) => rc.conflictType === RELATIONAL_CONFLICT_TYPE.TWO_FATHERS);

    const twoChildsByFkField = this._groupByFkField(twoChilds);

    const enrichedColumns = columns.map((col) => {
      const group = twoChildsByFkField[col.columnName];
      if (!group) { return col; }
      return { ...col, relationalConflict: this._buildRelationalDetail(group) };
    });

    const twoFathersConflict = twoFathers.length > 0 ? this._buildTwoFathersDetail(twoFathers) : null;

    return { columns: enrichedColumns, twoFathersConflict };
  }

  private _groupByFkField(conflicts: RelationalConflictEntity[]): Record<string, RelationalConflictEntity[]> {
    return conflicts.reduce<Record<string, RelationalConflictEntity[]>>((acc, rc) => {
      const fkField = Object.keys(FK_FIELD_TO_TABLE).find((k) => FK_FIELD_TO_TABLE[k] === rc.relatedTable);
      if (!fkField) { return acc; }
      if (!acc[fkField]) { acc[fkField] = []; }
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
    if (!entityData) { return {}; }
    return Object.entries(entityData)
      .filter(([key]) => key.endsWith(FK_ID_SUFFIX) && key !== 'id')
      .reduce<Record<string, string | null>>((acc, [key, val]) => {
        acc[key] = typeof val === 'string' ? val : null;
        return acc;
      }, {});
  }
}
