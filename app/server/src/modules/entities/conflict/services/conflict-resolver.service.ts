import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { EntityService } from '../../../data-processor/types/entity-service.type';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { ConflictEntity } from '../entities/conflict.entity';
import { ConflictRepository } from '../conflict.repository';
import { ResolveConflictDto } from '../dto/resolve-conflict.dto';

@Injectable()
export class ConflictResolverService {
  public constructor(
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  /** Picks a winner value for an open conflict group and persists the resolution. */
  public async resolve(resolveConflictDto: ResolveConflictDto): Promise<BaseEntity> {
    const { tableName, entityId, columnName, winnerValue, conflictResolver, resolutionNotes } = resolveConflictDto;

    const conflicts = await this._fetchAndValidateConflicts(tableName, entityId, columnName, winnerValue);
    const entityService = this._registry.get(tableName);

    if (columnName.endsWith('Id')) {
      await this._applyFkIdWinner(entityService, entityId, columnName, winnerValue, conflicts);

    } else {
      const winnerConflict = conflicts.find((c) => c.newValue === winnerValue);

      if (winnerConflict) {
        const entity = await entityService.findById(entityId);

        if (entity) {
          await entityService.update(
            entityId,
            { [columnName]: winnerValue },
            { [columnName]: winnerConflict.newSource ?? '' },
            entity.source,
            { [columnName]: winnerConflict.newNotes },
            entity.notes,
          );
        }
      }
    }

    await this._conflictRepository.resolveMany(tableName, entityId, columnName, conflictResolver, resolutionNotes);

    return this._fetchUpdatedEntity(entityService, entityId, tableName);
  }

  /** Fetches open conflicts for a group and validates that winnerValue is one of the competing values. */
  private async _fetchAndValidateConflicts(
    tableName: string, entityId: string, columnName: string, winnerValue: string,
  ): Promise<ConflictEntity[]> {
    const conflicts = await this._conflictRepository.findByGroup(tableName, entityId, columnName);

    if (conflicts.length === 0) {
      throw new NotFoundException('No open conflicts found for the specified group');
    }

    const validValues = new Set([...conflicts.map((c) => c.newValue), conflicts[0].oldValue]);

    if (!validValues.has(winnerValue)) {
      throw new BadRequestException('No such value available');
    }

    return conflicts;
  }

  /**
   * Applies a winning FK ID: renames the referenced entity to the winner ID,
   * updates the owning entity's source tracking, and soft-deletes all loser referenced entities.
   */
  private async _applyFkIdWinner(
    entityService: EntityService<{ id: string }>, entityId: string,
    columnName: string, winnerValue: string, conflicts: ConflictEntity[],
  ): Promise<void> {
    const referencedTableName = `${columnName.slice(0, -2)}s`;
    const referencedService = this._registry.get(referencedTableName);
    const oldId = conflicts[0].oldValue!;
    const allNewIds = conflicts.map((c) => c.newValue).filter((id): id is string => id !== null);
    const loserIds = [...new Set([oldId, ...allNewIds].filter((id) => id !== winnerValue))];

    const winnerConflict = conflicts.find((c) => c.newValue === winnerValue);
    const winnerSource = winnerConflict?.newSource ?? '';
    const winnerNotes = winnerConflict?.newNotes ?? null;

    if (winnerValue !== oldId) {
      const owningEntity = await entityService.findById(entityId);
      if (owningEntity) {
        await entityService.update(
          entityId,
          { [columnName]: winnerValue },
          { [columnName]: winnerSource },
          owningEntity.source,
          { [columnName]: winnerNotes },
          owningEntity.notes,
        );
      }
    }

    await Promise.all(loserIds.map((id) => referencedService.softDelete(id)));
  }

  /** Fetches the entity after resolution and throws if it is missing. */
  private async _fetchUpdatedEntity(entityService: EntityService<{ id: string }>, entityId: string, tableName: string): Promise<BaseEntity> {
    const updatedEntity = await entityService.findById(entityId);

    if (!updatedEntity) {
      throw new NotFoundException(`Entity not found after resolution: ${tableName}/${entityId}`);
    }

    return updatedEntity;
  }
}
