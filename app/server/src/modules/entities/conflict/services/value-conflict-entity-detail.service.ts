import { Injectable, NotFoundException } from '@nestjs/common';
import { ValueConflictRepository } from '../value-conflict.repository';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { ConflictColumnDetail, ConflictEntityDetailResponse } from '../types/conflict-entity-detail-response.type';

const EXCLUDED_COLUMNS = new Set(['source', 'notes', 'createdAt', 'updatedAt', 'deletedAt']);

@Injectable()
export class ValueConflictEntityDetailService {
  public constructor(
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _entityServiceRegistry: EntityServiceRegistry,
  ) {}

  public async getEntityDetail(tableName: string, entityId: string): Promise<ConflictEntityDetailResponse> {
    const entityService = this._entityServiceRegistry.get(tableName);
    const entity = await entityService.findById(entityId);

    if (!entity) {
      throw new NotFoundException(`Entity not found: ${tableName}/${entityId}`);
    }

    const openConflicts = await this._valueConflictRepository.findOpenByEntity(tableName, entityId);

    const conflictsByColumn = openConflicts.reduce<Record<string, typeof openConflicts>>((acc, conflict) => {
      const col = conflict.columnName!;
      acc[col] = [...(acc[col] ?? []), conflict];
      return acc;
    }, {});

    const entityRecord = entity as unknown as Record<string, unknown>;
    const source = (entityRecord['source'] as Record<string, string | null>) ?? {};
    const notes = (entityRecord['notes'] as Record<string, string | null>) ?? {};
    const currentDate = (entity.updatedAt as Date).toISOString();

    return Object.keys(entityRecord)
      .filter((key) => !EXCLUDED_COLUMNS.has(key))
      .map<ConflictColumnDetail>((columnName) => {
        const conflicts = conflictsByColumn[columnName] ?? [];
        const isConflicted = conflicts.length > 0;

        return {
          columnName,
          currentValue: entityRecord[columnName] != null ? String(entityRecord[columnName]) : null,
          currentSource: source[columnName] ?? null,
          currentNotes: notes[columnName] ?? null,
          currentDate,
          isConflicted,
          conflictValues: isConflicted
            ? conflicts.flatMap((c) => [
                { value: c.oldValue, source: c.oldSource, notes: c.oldNotes, createdAt: c.createdAt.toISOString() },
                { value: c.newValue, source: c.newSource, notes: c.newNotes, createdAt: c.createdAt.toISOString() },
              ])
            : [],
        };
      });
  }
}
