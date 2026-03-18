import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../../shared/entities/base.entity';
import { EntityService } from '../data-processor/types/entity-service.type';
import { EntityServiceRegistry } from '../../shared/services/entity-service-registry.service';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictRepository } from './conflict.repository';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';

@Injectable()
export class ConflictResolverService {
  public constructor(
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async resolve(resolveConflictDto: ResolveConflictDto): Promise<BaseEntity> {
    const { tableName, entityId, columnName, winnerValue, conflictResolver, resolutionNotes } = resolveConflictDto;

    const conflicts = await this._fetchAndValidateConflicts(tableName, entityId, columnName, winnerValue);

    const entityService = this._registry.get(tableName);

    if (columnName.endsWith('Id')) {
      await this._applyFkIdWinner(entityService, entityId, columnName, winnerValue, conflicts);
    } else {
      const winnerConflict = conflicts.find((conflict) => conflict.newValue === winnerValue);
      if (winnerConflict) {
        await this._applyFieldWinner(entityService, entityId, columnName, winnerValue, winnerConflict);
      }
    }

    await this._conflictRepository.resolveMany(tableName, entityId, columnName, conflictResolver, resolutionNotes);

    return this._fetchUpdatedEntity(entityService, entityId, tableName);
  }

  private async _fetchAndValidateConflicts(
    tableName: string,
    entityId: string,
    columnName: string,
    winnerValue: string,
  ): Promise<ConflictEntity[]> {
    const conflicts = await this._conflictRepository.findByGroup(tableName, entityId, columnName);

    if (conflicts.length === 0) {
      throw new NotFoundException('No open conflicts found for the specified group');
    }

    const validValues = new Set([...conflicts.map((conflict) => conflict.newValue), conflicts[0].oldValue]);

    if (!validValues.has(winnerValue)) {
      throw new BadRequestException('No such value available');
    }

    return conflicts;
  }

  private async _applyFkIdWinner(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    columnName: string,
    winnerValue: string,
    conflicts: ConflictEntity[],
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

  private async _applyFieldWinner(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    columnName: string,
    winnerValue: string,
    winnerConflict: ConflictEntity,
  ): Promise<void> {
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

  private async _fetchUpdatedEntity(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    tableName: string,
  ): Promise<BaseEntity> {
    const updatedEntity = await entityService.findById(entityId);

    if (!updatedEntity) {
      throw new NotFoundException(`Entity not found after resolution: ${tableName}/${entityId}`);
    }

    return updatedEntity;
  }
}
