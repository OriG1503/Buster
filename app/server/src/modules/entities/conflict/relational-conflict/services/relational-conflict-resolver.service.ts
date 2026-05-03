import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../../../shared/services/logger/logger.service';
import { EntityServiceRegistry } from '../../../../../shared/services/entity-service-registry.service';
import { FK_FIELD_TO_TABLE } from '../../../../../shared/consts/fk-field-to-table.const';
import { RELATIONAL_CONFLICT_TYPE } from '../consts/relational-conflict-type.const';
import { RelationalConflictRepository } from '../relational-conflict.repository';
import { RelationalConflictEntity } from '../entities/relational-conflict.entity';
import { ResolveRelationalConflictDto } from '../dto/resolve-relational-conflict.dto';

@Injectable()
export class RelationalConflictResolverService {
  public constructor(
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _registry: EntityServiceRegistry,
    private readonly _logger: LoggerService,
  ) {}

  public async resolve(dto: ResolveRelationalConflictDto): Promise<RelationalConflictEntity> {
    const { conflictIds, winnerRelatedId, winnerChildId, winnerChildFkField, conflictResolver, resolutionNotes } = dto;
    this._logger.info(
      `RelationalConflictResolverService.resolve — conflictIds=[${conflictIds.join(', ')}], winnerRelatedId="${winnerRelatedId}", winnerChildId="${winnerChildId ?? 'none'}", resolver="${conflictResolver}"`,
      'app-workflow',
    );

    const conflicts = await Promise.all(conflictIds.map((id) => this._relationalConflictRepository.findById(id)));
    const primaryConflict = conflicts[0];

    if (!primaryConflict) {
      throw new NotFoundException(`Relational conflict not found: ${conflictIds[0]}`);
    }

    const allCompetingIds = new Set(conflicts.flatMap((c) => (c ? [c.oldRelatedId, c.newRelatedId] : [])));
    if (!allCompetingIds.has(winnerRelatedId)) {
      throw new BadRequestException('winnerRelatedId must be one of the competing related IDs');
    }

    const primaryForWinner = conflicts.find(
      (c) => c && (c.oldRelatedId === winnerRelatedId || c.newRelatedId === winnerRelatedId),
    );
    if (!primaryForWinner) {
      throw new NotFoundException('Could not find conflict for winner');
    }

    if (primaryConflict.conflictType === RELATIONAL_CONFLICT_TYPE.TWO_CHILDS) {
      this._logger.debug(
        `RelationalConflictResolverService.resolve — branch TWO_CHILDS for "${primaryForWinner.anchorTable}/${primaryForWinner.anchorId}"`,
        'app-workflow',
      );
      await this._resolveTwoChilds(
        primaryForWinner,
        winnerRelatedId,
        winnerChildId ?? null,
        winnerChildFkField ?? null,
      );
    } else {
      this._logger.debug(
        `RelationalConflictResolverService.resolve — branch TWO_FATHERS for "${primaryForWinner.anchorTable}/${primaryForWinner.anchorId}"`,
        'app-workflow',
      );
      await this._resolveTwoFathers(primaryForWinner, winnerRelatedId);
    }

    await Promise.all(
      conflictIds.map((id) =>
        this._relationalConflictRepository.resolve(id, conflictResolver, resolutionNotes ?? null),
      ),
    );
    this._logger.info(
      `RelationalConflictResolverService.resolve — closed ${conflictIds.length} relational conflict(s)`,
      'app-workflow',
    );

    return this._relationalConflictRepository.findById(conflictIds[0]) as Promise<RelationalConflictEntity>;
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
    const winnerSourceTime =
      winnerRelatedId === oldRelatedId ? conflict.oldRelatedSourceTime : conflict.newRelatedSourceTime;

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
        { [anchorFkField]: winnerSourceTime ?? null },
        anchorEntity.sourceTime,
      );
    }

    if (winnerChildId && winnerChildFkField) {
      await this._applyWinnerChildCombination(winnerRelatedId, relatedTable, winnerChildId, winnerChildFkField);
    }

    // The loser becomes a floating entity — intentionally left in its table and not soft-deleted.
    const loserId = winnerRelatedId === oldRelatedId ? newRelatedId : oldRelatedId;
    void loserId;
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

    const childTable = FK_FIELD_TO_TABLE[winnerChildFkField];
    if (childTable) {
      const currentOwner = await winnerService.findByFkValue(winnerChildFkField, winnerChildId, winnerRelatedId);
      if (currentOwner) {
        await this._registry
          .get(relatedTable)
          .update(
            currentOwner.id,
            { [winnerChildFkField]: null },
            {},
            currentOwner.source,
            {},
            currentOwner.notes,
            {},
            currentOwner.sourceTime,
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
      {},
      winnerEntity.sourceTime,
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
          {},
          loserEntity.sourceTime,
        );
      }
    }

    if (winnerEntity) {
      const winnerRecord = winnerEntity as unknown as Record<string, unknown>;
      if (winnerRecord[childFkField] !== anchorId) {
        const winnerSource = winnerRelatedId === oldRelatedId ? conflict.oldRelatedSource : conflict.newRelatedSource;
        const winnerNotes = winnerRelatedId === oldRelatedId ? conflict.oldRelatedNotes : conflict.newRelatedNotes;
        const winnerSourceTime =
          winnerRelatedId === oldRelatedId ? conflict.oldRelatedSourceTime : conflict.newRelatedSourceTime;

        await relatedService.update(
          winnerRelatedId,
          { [childFkField]: anchorId },
          { [childFkField]: winnerSource ?? '' },
          winnerEntity.source,
          { [childFkField]: winnerNotes ?? null },
          winnerEntity.notes,
          { [childFkField]: winnerSourceTime ?? null },
          winnerEntity.sourceTime,
        );
      }
    }
  }
}
