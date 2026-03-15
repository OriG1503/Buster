import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../../shared/entities/base.entity';
import { EntityServiceRegistry } from '../../shared/services/entity-service-registry.service';
import { ConflictRepository } from './conflict.repository';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';

@Injectable()
export class ConflictResolverService {
  public constructor(
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async resolve(resolveConflictDto: ResolveConflictDto): Promise<BaseEntity & Record<string, unknown>> {
    const { tableName, entityId, columnName, winnerValue, conflictResolver, notes } = resolveConflictDto;

    const conflicts = await this._conflictRepository.findByGroup(tableName, entityId, columnName);

    if (conflicts.length === 0) {
      throw new NotFoundException('No open conflicts found for the specified group');
    }

    const validValues = new Set([...conflicts.map((conflict) => conflict.newValue), conflicts[0].oldValue]);

    if (!validValues.has(winnerValue)) {
      throw new BadRequestException('No such value available');
    }

    const entityService = this._registry.get(tableName);
    const winnerConflict = conflicts.find((conflict) => conflict.newValue === winnerValue);

    if (winnerConflict) {
      if (columnName.endsWith('Id')) {
        const referencedTableName = `${columnName.slice(0, -2)}s`;
        const referencedService = this._registry.get(referencedTableName);
        const oldId = conflicts[0].oldValue!;
        const referencedEntity = await referencedService.findById(oldId);

        if (referencedEntity) {
          await referencedService.update(oldId, { id: winnerValue }, {}, referencedEntity.source);
        }

        const owningEntity = await entityService.findById(entityId);

        if (owningEntity) {
          await entityService.update(entityId, {}, { [columnName]: winnerConflict.newSource ?? '' }, owningEntity.source);
        }
      } else {
        const entity = await entityService.findById(entityId);

        if (entity) {
          await entityService.update(
            entityId,
            { [columnName]: winnerValue },
            { [columnName]: winnerConflict.newSource ?? '' },
            entity.source,
          );
        }
      }
    }

    await this._conflictRepository.resolveMany(tableName, entityId, columnName, conflictResolver, notes);

    const updatedEntity = await entityService.findById(entityId);

    if (!updatedEntity) {
      throw new NotFoundException(`Entity not found after resolution: ${tableName}/${entityId}`);
    }

    return updatedEntity;
  }
}
