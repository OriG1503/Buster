import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { LoggerService } from '../../../../shared/services/logger/logger.service';
import { EntityService } from '../../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { ValueConflictRepository } from '../value-conflict.repository';
import { RevertValueConflictDto } from '../value-conflict/dto/revert-value-conflict.dto';

@Injectable()
export class RevertService {
  public constructor(
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _registry: EntityServiceRegistry,
    private readonly _logger: LoggerService,
  ) {}

  /**
   * Reverts an entity field to a previously held value from a resolved value conflict.
   * Records the revert as a new pre-solved conflict and applies the value to the entity.
   */
  public async revert(dto: RevertValueConflictDto): Promise<BaseEntity> {
    const { tableName, entityId, columnName, revertValue, revertedBy, resolutionNotes } = dto;
    //LOG
    this._logger.info(
      `ConflictRevertService.revert — "${tableName}/${entityId}/${columnName}" → revert to "${revertValue}" by "${revertedBy}"${resolutionNotes ? ` notes="${resolutionNotes}"` : ''}`,
      'app-workflow',
    );

    const originalConflict = await this._valueConflictRepository.findResolvedByGroupValue(
      tableName,
      entityId,
      columnName,
      revertValue,
    );

    if (!originalConflict) {
      throw new BadRequestException('No resolved conflict found for the specified revert value');
    }

    const entityService = this._registry.get(tableName);
    const entity = await entityService.findById(entityId);

    if (!entity) {
      throw new NotFoundException(`Entity not found: ${tableName}/${entityId}`);
    }

    const currentValue = String((entity as unknown as Record<string, unknown>)[columnName] ?? '');

    if (currentValue === revertValue) {
      return entity;
    }

    const revertSource =
      originalConflict.newValue === revertValue ? originalConflict.newSource : originalConflict.oldSource;
    const revertNotes =
      originalConflict.newValue === revertValue ? originalConflict.newNotes : originalConflict.oldNotes;
    const revertSourceTime =
      originalConflict.newValue === revertValue ? originalConflict.newSourceTime : originalConflict.oldSourceTime;

    const mostRecentResolved = await this._valueConflictRepository.findMostRecentResolved(
      tableName,
      entityId,
      columnName,
    );
    const cascadedNotes = [mostRecentResolved?.resolutionNotes, resolutionNotes].filter(Boolean).join('\n');

    await this._valueConflictRepository.insertRevertConflict({
      tableName,
      entityId,
      columnName,
      oldValue: currentValue,
      oldSource: entity.source?.[columnName] ?? null,
      oldNotes: entity.notes?.[columnName] ?? null,
      oldSourceTime: entity.sourceTime?.[columnName] ?? null,
      newValue: revertValue,
      newSource: revertSource,
      newNotes: revertNotes,
      newSourceTime: revertSourceTime,
      conflictCreator: revertedBy,
      conflictResolver: revertedBy,
      resolutionNotes: cascadedNotes,
      isSolved: true,
    });

    await this._applyFieldRevert(
      entityService,
      entityId,
      entity,
      columnName,
      revertValue,
      revertSource,
      revertNotes,
      revertSourceTime,
    );
    //LOG
    this._logger.info(
      `ConflictRevertService.revert — applied revert "${tableName}/${entityId}/${columnName}" → "${revertValue}"`,
      'app-workflow',
    );

    return this._fetchUpdatedEntity(entityService, entityId, tableName);
  }

  /** Reverts a plain field value on the entity. */
  private async _applyFieldRevert(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    entity: BaseEntity,
    columnName: string,
    revertValue: string,
    revertSource: string | null,
    revertNotes: string | null,
    revertSourceTime: string | null,
  ): Promise<void> {
    await entityService.update(
      entityId,
      { [columnName]: revertValue },
      { [columnName]: revertSource ?? '' },
      entity.source,
      { [columnName]: revertNotes },
      entity.notes,
      { [columnName]: revertSourceTime ?? null },
      entity.sourceTime,
    );
  }

  /** Fetches the entity after the revert is applied and throws if it is missing. */
  private async _fetchUpdatedEntity(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    tableName: string,
  ): Promise<BaseEntity> {
    const updatedEntity = await entityService.findById(entityId);

    if (!updatedEntity) {
      throw new NotFoundException(`Entity not found after revert: ${tableName}/${entityId}`);
    }

    return updatedEntity;
  }
}
