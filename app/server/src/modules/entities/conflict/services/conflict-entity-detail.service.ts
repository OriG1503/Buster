import { Injectable } from '@nestjs/common';
import { ValueConflictEntityDetailService } from './value-conflict-entity-detail.service';
import { RelationalConflictRepository } from '../relational-conflict.repository';
import { ConflictEntityDetailResponse } from '../types/conflict-entity-detail-response.type';
import { RelationalConflictEntity } from '../entities/relational-conflict.entity';
import { FK_FIELD_TO_TABLE } from '../../../../shared/consts/entity-relation-map.const';

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

    const relationalByFkField = relationalConflicts.reduce<Record<string, RelationalConflictEntity>>((acc, rc) => {
      const fkField = Object.keys(FK_FIELD_TO_TABLE).find((k) => FK_FIELD_TO_TABLE[k] === rc.relatedTable);
      if (fkField) { acc[fkField] = rc; }
      return acc;
    }, {});

    return columns.map((col) => {
      const rc = relationalByFkField[col.columnName];
      if (!rc) { return col; }
      return {
        ...col,
        relationalConflict: {
          conflictId: rc.id,
          conflictType: rc.conflictType,
          oldRelatedId: rc.oldRelatedId,
          newRelatedId: rc.newRelatedId,
          relatedTable: rc.relatedTable,
          oldRelatedSource: rc.oldRelatedSource,
          newRelatedSource: rc.newRelatedSource,
          snapshot: rc.snapshot,
        },
      };
    });
  }
}
