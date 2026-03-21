import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { FK_FIELD_TO_TABLE } from '../../../../shared/consts/entity-relation-map.const';
import { RELATIONAL_CONFLICT_TYPE } from '../consts/relational-conflict-type.const';
import { RelationalConflictRepository } from '../relational-conflict.repository';
import { RelationalConflictEntity } from '../entities/relational-conflict.entity';
import { ResolveRelationalConflictDto } from '../dto/resolve-relational-conflict.dto';

@Injectable()
export class RelationalConflictResolverService {
  public constructor(
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async resolve(dto: ResolveRelationalConflictDto): Promise<RelationalConflictEntity> {
    const { conflictId, winnerRelatedId, winnerChildId, winnerChildFkField, conflictResolver, resolutionNotes } = dto;

    const conflict = await this._relationalConflictRepository.findById(conflictId);

    if (!conflict) {
      throw new NotFoundException(`Relational conflict not found: ${conflictId}`);
    }

    if (conflict.isSolved) {
      throw new BadRequestException(`Conflict ${conflictId} is already resolved`);
    }

    if (winnerRelatedId !== conflict.oldRelatedId && winnerRelatedId !== conflict.newRelatedId) {
      throw new BadRequestException('winnerRelatedId must be either oldRelatedId or newRelatedId');
    }

    if (conflict.conflictType === RELATIONAL_CONFLICT_TYPE.TWO_CHILDS) {
      await this._resolveTwoChilds(conflict, winnerRelatedId, winnerChildId ?? null, winnerChildFkField ?? null);
    } else {
      await this._resolveTwoFathers(conflict, winnerRelatedId);
    }

    await this._relationalConflictRepository.resolve(conflictId, conflictResolver, resolutionNotes ?? null);

    return this._relationalConflictRepository.findById(conflictId) as Promise<RelationalConflictEntity>;
  }

  /**
   * TWO_CHILDS resolution:
   * 1. Points the anchor to the winner related entity.
   * 2. If a cross-combination child is specified, moves it to the winner (detaching from current owner).
   * Orphaned (floating) entities are intentionally left in their tables — they remain
   * visible and are not soft-deleted.
   */
  private async _resolveTwoChilds(
    conflict: RelationalConflictEntity,
    winnerRelatedId: string,
    winnerChildId: string | null,
    winnerChildFkField: string | null,
  ): Promise<void> {
    const { anchorId, anchorTable, oldRelatedId, newRelatedId, relatedTable } = conflict;
    const winnerSource = winnerRelatedId === oldRelatedId ? conflict.oldRelatedSource : conflict.newRelatedSource;
    const winnerNotes = winnerRelatedId === oldRelatedId ? conflict.oldRelatedNotes : conflict.newRelatedNotes;

    const anchorFkField = `${relatedTable.slice(0, -1)}Id`; // 'communications' → 'communicationId'
    const anchorService = this._registry.get(anchorTable);
    const anchorEntity = await anchorService.findById(anchorId);

    if (!anchorEntity) {
      throw new NotFoundException(`Anchor entity not found: ${anchorTable}/${anchorId}`);
    }

    const anchorRecord = anchorEntity as unknown as Record<string, unknown>;

    if (anchorRecord[anchorFkField] !== winnerRelatedId) {
      await anchorService.update(
        anchorId,
        { [anchorFkField]: winnerRelatedId },
        { [anchorFkField]: winnerSource ?? '' },
        anchorEntity.source,
        { [anchorFkField]: winnerNotes ?? null },
        anchorEntity.notes,
      );
    }

    if (winnerChildId && winnerChildFkField) {
      await this._applyWinnerChildCombination(winnerRelatedId, relatedTable, winnerChildId, winnerChildFkField);
    }

    // The loser (oldRelatedId or newRelatedId that wasn't chosen) becomes a floating entity.
    // It is intentionally left in its table and not soft-deleted.
    const loserId = winnerRelatedId === oldRelatedId ? newRelatedId : oldRelatedId;
    void loserId; // explicitly unused — floating entities stay visible
  }

  /**
   * Moves winnerChildId to the winner entity.
   * The winner's previous child and the child's previous parent become floating entities —
   * they are left in their tables and not soft-deleted.
   */
  private async _applyWinnerChildCombination(
    winnerRelatedId: string,
    relatedTable: string,
    winnerChildId: string,
    winnerChildFkField: string,
  ): Promise<void> {
    const winnerService = this._registry.get(relatedTable);
    const winnerEntity = await winnerService.findById(winnerRelatedId);

    if (!winnerEntity) {
      return;
    }

    // Detach winnerChildId from its current parent (if it has one other than the winner).
    const childTable = FK_FIELD_TO_TABLE[winnerChildFkField];
    if (childTable) {
      const currentOwner = await winnerService.findByFkValue(winnerChildFkField, winnerChildId, winnerRelatedId);
      if (currentOwner) {
        const currentOwnerEntity = currentOwner as unknown as Record<string, unknown>;
        await this._registry.get(relatedTable).update(
          currentOwner.id as string,
          { [winnerChildFkField]: null },
          {},
          (currentOwnerEntity['source'] as Record<string, string | null>) ?? null,
          {},
          (currentOwnerEntity['notes'] as Record<string, string | null>) ?? null,
        );
      }
    }

    await winnerService.update(
      winnerRelatedId,
      { [winnerChildFkField]: winnerChildId },
      {},
      winnerEntity.source,
      {},
      winnerEntity.notes,
    );
  }

  /**
   * TWO_FATHERS resolution:
   * - Winner keeps (or gains) the FK pointing to the anchor child.
   * - Loser's FK is set to null (it becomes a floating parent, still visible in its table).
   */
  private async _resolveTwoFathers(conflict: RelationalConflictEntity, winnerRelatedId: string): Promise<void> {
    const { anchorId, anchorTable, oldRelatedId, newRelatedId, relatedTable } = conflict;
    const loserRelatedId = winnerRelatedId === oldRelatedId ? newRelatedId : oldRelatedId;

    const childFkField = `${anchorTable.slice(0, -1)}Id`; // 'communications' → 'communicationId'
    const relatedService = this._registry.get(relatedTable);

    const [winnerEntity, loserEntity] = await Promise.all([
      relatedService.findById(winnerRelatedId),
      relatedService.findById(loserRelatedId),
    ]);

    if (loserEntity) {
      const loserRecord = loserEntity as unknown as Record<string, unknown>;
      if (loserRecord[childFkField] === anchorId) {
        await relatedService.update(
          loserRelatedId,
          { [childFkField]: null },
          {},
          loserEntity.source,
          {},
          loserEntity.notes,
        );
      }
    }

    if (winnerEntity) {
      const winnerRecord = winnerEntity as unknown as Record<string, unknown>;
      if (winnerRecord[childFkField] !== anchorId) {
        const winnerSource = winnerRelatedId === oldRelatedId ? conflict.oldRelatedSource : conflict.newRelatedSource;
        const winnerNotes = winnerRelatedId === oldRelatedId ? conflict.oldRelatedNotes : conflict.newRelatedNotes;

        await relatedService.update(
          winnerRelatedId,
          { [childFkField]: anchorId },
          { [childFkField]: winnerSource ?? '' },
          winnerEntity.source,
          { [childFkField]: winnerNotes ?? null },
          winnerEntity.notes,
        );
      }
    }
  }
}
