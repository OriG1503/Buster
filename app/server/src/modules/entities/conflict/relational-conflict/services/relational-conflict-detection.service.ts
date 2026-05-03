import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../../shared/services/logger/logger.service';
import { RelationalConflictRepository } from '../relational-conflict.repository';
import { SnapshotBuilderService } from './snapshot-builder.service';
import { RELATIONAL_CONFLICT_TYPE } from '../consts/relational-conflict-type.const';
import { RelationalConflictSnapshot } from '../types/relational-conflict-snapshot.type';

@Injectable()
export class RelationalConflictDetectionService {
  public constructor(
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _snapshotBuilder: SnapshotBuilderService,
    private readonly _logger: LoggerService,
  ) {}

  /**
   * TWO_CHILDS: one anchor (parent) entity has two competing child IDs for the same FK field.
   * Example: robot1 had communicationId=comm1, incoming data says communicationId=comm2.
   * Called from DataProcessorService when an existing entity's FK field differs from incoming.
   */
  public async detectTwoChilds(
    anchorId: string,
    anchorTable: string,
    anchorSource: string | null,
    anchorNotes: string | null,
    anchorSourceTime: string | null,
    oldRelatedId: string,
    newRelatedId: string,
    relatedTable: string,
    oldRelatedSource: string | null,
    oldRelatedNotes: string | null,
    oldRelatedSourceTime: string | null,
    newRelatedSource: string | null,
    newRelatedNotes: string | null,
    newRelatedSourceTime: string | null,
    conflictCreator: string,
  ): Promise<number | null> {
    this._logger.warn(
      `RelationalConflictDetectionService.detectTwoChilds — TWO_CHILDS: "${anchorTable}/${anchorId}" has two competing "${relatedTable}" children — old="${oldRelatedId}", new="${newRelatedId}", creator="${conflictCreator}"`,
      'app-workflow',
    );
    const snapshot = await this._buildSnapshot(anchorId, anchorTable, oldRelatedId, newRelatedId, relatedTable);

    return this._relationalConflictRepository.insertConflict({
      conflictType: RELATIONAL_CONFLICT_TYPE.TWO_CHILDS,
      anchorId,
      anchorTable,
      anchorSource,
      anchorNotes,
      anchorSourceTime,
      oldRelatedId,
      newRelatedId,
      relatedTable,
      oldRelatedSource,
      oldRelatedNotes,
      oldRelatedSourceTime,
      newRelatedSource,
      newRelatedNotes,
      newRelatedSourceTime,
      snapshot,
      conflictCreator,
      isSolved: false,
    });
  }

  /**
   * TWO_FATHERS: two parent entities compete to own the same child.
   * Example: robot1 already has communicationId=comm1, and robot2 also tries to claim comm1.
   * Called from DataProcessorService before inserting an entity that claims an already-owned child.
   */
  public async detectTwoFathers(
    anchorId: string,
    anchorTable: string,
    anchorSource: string | null,
    anchorNotes: string | null,
    anchorSourceTime: string | null,
    oldRelatedId: string,
    newRelatedId: string,
    relatedTable: string,
    oldRelatedSource: string | null,
    oldRelatedNotes: string | null,
    oldRelatedSourceTime: string | null,
    newRelatedSource: string | null,
    newRelatedNotes: string | null,
    newRelatedSourceTime: string | null,
    conflictCreator: string,
  ): Promise<number | null> {
    this._logger.warn(
      `RelationalConflictDetectionService.detectTwoFathers — TWO_FATHERS: "${anchorTable}/${anchorId}" claimed by two "${relatedTable}" parents — old="${oldRelatedId}", new="${newRelatedId}", creator="${conflictCreator}"`,
      'app-workflow',
    );
    const snapshot = await this._buildSnapshot(anchorId, anchorTable, oldRelatedId, newRelatedId, relatedTable);

    return this._relationalConflictRepository.insertConflict({
      conflictType: RELATIONAL_CONFLICT_TYPE.TWO_FATHERS,
      anchorId,
      anchorTable,
      anchorSource,
      anchorNotes,
      anchorSourceTime,
      oldRelatedId,
      newRelatedId,
      relatedTable,
      oldRelatedSource,
      oldRelatedNotes,
      oldRelatedSourceTime,
      newRelatedSource,
      newRelatedNotes,
      newRelatedSourceTime,
      snapshot,
      conflictCreator,
      isSolved: false,
    });
  }

  private async _buildSnapshot(
    anchorId: string,
    anchorTable: string,
    oldRelatedId: string,
    newRelatedId: string,
    relatedTable: string,
  ): Promise<RelationalConflictSnapshot> {
    const [anchor, oldRelated, newRelated] = await Promise.all([
      this._snapshotBuilder.buildEntitySnapshot(anchorId, anchorTable),
      this._snapshotBuilder.buildEntitySnapshot(oldRelatedId, relatedTable),
      this._snapshotBuilder.buildEntitySnapshot(newRelatedId, relatedTable),
    ]);

    return { anchor, oldRelated, newRelated };
  }
}
