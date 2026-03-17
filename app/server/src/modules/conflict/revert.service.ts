import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../../shared/entities/base.entity';
import { EntityService } from '../data-processor/types/entity-service.type';
import { EntityServiceRegistry } from '../../shared/services/entity-service-registry.service';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictRepository } from './conflict.repository';
import { RevertConflictDto } from './dto/revert-conflict.dto';

@Injectable()
export class RevertService {
  public constructor(
    private readonly _conflictRepository: ConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async revert(dto: RevertConflictDto): Promise<BaseEntity> {
    const { tableName, entityId, columnName, revertValue, revertedBy, resolutionNotes } = dto;

    const originalConflict = await this._conflictRepository.findResolvedByGroupValue(
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

    const currentValue = String(((entity as unknown) as Record<string, unknown>)[columnName] ?? '');

    if (currentValue === revertValue) {
      return entity;
    }

    const revertSource = originalConflict.newValue === revertValue ? originalConflict.newSource : originalConflict.oldSource;
    const revertNotes = originalConflict.newValue === revertValue ? originalConflict.newNotes : originalConflict.oldNotes;

    await this._conflictRepository.insertRevertConflict({
      tableName,
      entityId,
      columnName,
      oldValue: currentValue,
      oldSource: entity.source?.[columnName] ?? null,
      oldNotes: entity.notes?.[columnName] ?? null,
      newValue: revertValue,
      newSource: revertSource,
      newNotes: revertNotes,
      conflictCreator: revertedBy,
      conflictResolver: revertedBy,
      resolutionNotes,
      isSolved: true,
    });

    await this._applyRevertValue(entityService, entityId, entity, columnName, currentValue, revertValue, revertSource, revertNotes);

    return this._fetchUpdatedEntity(entityService, entityId, tableName);
  }

  private async _applyRevertValue(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    entity: BaseEntity,
    columnName: string,
    currentValue: string,
    revertValue: string,
    revertSource: string | null,
    revertNotes: string | null,
  ): Promise<void> {
    if (columnName.endsWith('Id')) {
      await this._applyFkIdRevert(entityService, entityId, entity, columnName, currentValue, revertValue, revertSource, revertNotes);
    } else {
      await this._applyFieldRevert(entityService, entityId, entity, columnName, revertValue, revertSource, revertNotes);
    }
  }

  private async _applyFkIdRevert(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    entity: BaseEntity,
    columnName: string,
    currentFkId: string,
    revertValue: string,
    revertSource: string | null,
    revertNotes: string | null,
  ): Promise<void> {
    const referencedTableName = `${columnName.slice(0, -2)}s`;
    const referencedService = this._registry.get(referencedTableName);
    const referencedEntity = await referencedService.findById(currentFkId);

    if (referencedEntity) {
      await referencedService.update(
        currentFkId,
        { id: revertValue },
        { id: revertSource ?? '' },
        referencedEntity.source,
        { id: revertNotes },
        referencedEntity.notes,
      );
    }

    await entityService.update(
      entityId,
      {},
      { [columnName]: revertSource ?? '' },
      entity.source,
      { [columnName]: revertNotes },
      entity.notes,
    );
  }

  private async _applyFieldRevert(
    entityService: EntityService<{ id: string }>,
    entityId: string,
    entity: BaseEntity,
    columnName: string,
    revertValue: string,
    revertSource: string | null,
    revertNotes: string | null,
  ): Promise<void> {
    await entityService.update(
      entityId,
      { [columnName]: revertValue },
      { [columnName]: revertSource ?? '' },
      entity.source,
      { [columnName]: revertNotes },
      entity.notes,
    );
  }

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
