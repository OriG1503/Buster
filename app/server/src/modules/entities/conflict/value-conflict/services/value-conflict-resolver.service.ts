import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../../../../../shared/entities/base.entity';
import { LoggerService } from '../../../../../shared/services/logger/logger.service';
import { EntityServiceRegistry } from '../../../../../shared/services/entity-service-registry.service';
import { ValueConflictEntity } from '../entities/value-conflict.entity';
import { ValueConflictRepository } from '../value-conflict.repository';
import { ResolveValueConflictDto } from '../dto/resolve-value-conflict.dto';

@Injectable()
export class ValueConflictResolverService {
  public constructor(
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _registry: EntityServiceRegistry,
    private readonly _logger: LoggerService,
  ) {}

  /** Picks a winner value for an open value-conflict group and persists the resolution. */
  public async resolve(resolveConflictDto: ResolveValueConflictDto): Promise<BaseEntity> {
    const { tableName, entityId, columnName, winnerValue, conflictResolver, resolutionNotes } = resolveConflictDto;
    this._logger.info(
      `ValueConflictResolverService.resolve — "${tableName}/${entityId}/${columnName}" → winner "${winnerValue}" by "${conflictResolver}"${resolutionNotes ? ` notes="${resolutionNotes}"` : ''}`,
      'app-workflow',
    );

    const conflicts = await this._fetchAndValidateConflicts(tableName, entityId, columnName, winnerValue);
    this._logger.debug(
      `ValueConflictResolverService.resolve — fetched ${conflicts.length} conflict(s) for group`,
      'app-workflow',
    );
    const entityService = this._registry.get(tableName);
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
          { [columnName]: winnerConflict.newSourceTime ?? null },
          entity.sourceTime,
        );
      }
    }

    await this._valueConflictRepository.resolveMany(tableName, entityId, columnName, conflictResolver, resolutionNotes);
    this._logger.info(
      `ValueConflictResolverService.resolve — group "${tableName}/${entityId}/${columnName}" closed`,
      'app-workflow',
    );

    return this._fetchUpdatedEntity(entityService, entityId, tableName);
  }

  /** Fetches open value conflicts for a group and validates that winnerValue is one of the competing values. */
  private async _fetchAndValidateConflicts(
    tableName: string,
    entityId: string,
    columnName: string,
    winnerValue: string,
  ): Promise<ValueConflictEntity[]> {
    const conflicts = await this._valueConflictRepository.findByGroup(tableName, entityId, columnName);

    if (conflicts.length === 0) {
      throw new NotFoundException('No open value conflicts found for the specified group');
    }

    const validValues = new Set([...conflicts.map((c) => c.newValue), conflicts[0].oldValue]);

    if (!validValues.has(winnerValue)) {
      throw new BadRequestException('No such value available');
    }

    return conflicts;
  }

  /** Fetches the entity after resolution and throws if it is missing. */
  private async _fetchUpdatedEntity(
    entityService: { findById(id: string): Promise<BaseEntity | null> },
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
