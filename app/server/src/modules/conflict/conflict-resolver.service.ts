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

  public async resolve(resolveConflictDto: ResolveConflictDto): Promise<BaseEntity & Record<string, unknown>> {
    const { tableName, entityId, columnName, winnerValue, conflictResolver, resolutionNotes } = resolveConflictDto;

    const conflicts = await this._fetchAndValidateConflicts(tableName, entityId, columnName, winnerValue);

    const entityService = this._registry.get(tableName);
    const winnerConflict = conflicts.find((conflict) => conflict.newValue === winnerValue);

    if (winnerConflict) {
      await this._applyWinnerValue(entityService, entityId, columnName, winnerValue, winnerConflict, conflicts);
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

  private async _applyWinnerValue(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    columnName: string,
    winnerValue: string,
    winnerConflict: ConflictEntity,
    conflicts: ConflictEntity[],
  ): Promise<void> {
    if (columnName.endsWith('Id')) {
      await this._applyFkIdWinner(entityService, entityId, columnName, winnerValue, winnerConflict, conflicts);
    } else {
      await this._applyFieldWinner(entityService, entityId, columnName, winnerValue, winnerConflict);
    }
  }

  private async _applyFkIdWinner(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    columnName: string,
    winnerValue: string,
    winnerConflict: ConflictEntity,
    conflicts: ConflictEntity[],
  ): Promise<void> {
    const referencedTableName = `${columnName.slice(0, -2)}s`;
    const referencedService = this._registry.get(referencedTableName);
    const oldId = conflicts[0].oldValue!;
    const referencedEntity = await referencedService.findById(oldId);

    if (referencedEntity) {
      await referencedService.update(
        oldId,
        { id: winnerValue },
        { id: winnerConflict.newSource ?? '' },
        referencedEntity.source,
        { id: winnerConflict.newNotes },
        referencedEntity.notes,
      );
    }

    const owningEntity = await entityService.findById(entityId);

    if (owningEntity) {
      await entityService.update(
        entityId,
        {},
        { [columnName]: winnerConflict.newSource ?? '' },
        owningEntity.source,
        { [columnName]: winnerConflict.newNotes },
        owningEntity.notes,
      );
    }
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
  ): Promise<BaseEntity & Record<string, unknown>> {
    const updatedEntity = await entityService.findById(entityId);

    if (!updatedEntity) {
      throw new NotFoundException(`Entity not found after resolution: ${tableName}/${entityId}`);
    }

    return updatedEntity;
  }
}
