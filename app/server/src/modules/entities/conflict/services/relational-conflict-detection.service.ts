import { Injectable, Logger } from '@nestjs/common';
import { RelationalConflictRepository } from '../relational-conflict.repository';
import { SnapshotBuilderService } from './snapshot-builder.service';
import { RELATIONAL_CONFLICT_TYPE } from '../consts/relational-conflict-type.const';
import { RelationalConflictSnapshot } from '../types/relational-conflict-snapshot.type';

@Injectable()
export class RelationalConflictDetectionService {
  private readonly _logger = new Logger(RelationalConflictDetectionService.name);

  public constructor(
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _snapshotBuilder: SnapshotBuilderService,
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
    oldRelatedId: string,
    newRelatedId: string,
    relatedTable: string,
    oldRelatedSource: string | null,
    oldRelatedNotes: string | null,
    newRelatedSource: string | null,
    newRelatedNotes: string | null,
    conflictCreator: string,
  ): Promise<number | null> {
    this._logger.warn(`TWO_CHILDS: ${anchorTable}/${anchorId} has two competing ${relatedTable}s — old: ${oldRelatedId}, new: ${newRelatedId}`);
    const snapshot = await this._buildSnapshot(anchorId, anchorTable, oldRelatedId, newRelatedId, relatedTable);

    return this._relationalConflictRepository.insertConflict({
      conflictType: RELATIONAL_CONFLICT_TYPE.TWO_CHILDS,
      anchorId,
      anchorTable,
      anchorSource,
      anchorNotes,
      oldRelatedId,
      newRelatedId,
      relatedTable,
      oldRelatedSource,
      oldRelatedNotes,
      newRelatedSource,
      newRelatedNotes,
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
    oldRelatedId: string,
    newRelatedId: string,
    relatedTable: string,
    oldRelatedSource: string | null,
    oldRelatedNotes: string | null,
    newRelatedSource: string | null,
    newRelatedNotes: string | null,
    conflictCreator: string,
  ): Promise<number | null> {
    this._logger.warn(`TWO_FATHERS: ${anchorTable}/${anchorId} claimed by two ${relatedTable}s — old: ${oldRelatedId}, new: ${newRelatedId}`);
    const snapshot = await this._buildSnapshot(anchorId, anchorTable, oldRelatedId, newRelatedId, relatedTable);

    return this._relationalConflictRepository.insertConflict({
      conflictType: RELATIONAL_CONFLICT_TYPE.TWO_FATHERS,
      anchorId,
      anchorTable,
      anchorSource,
      anchorNotes,
      oldRelatedId,
      newRelatedId,
      relatedTable,
      oldRelatedSource,
      oldRelatedNotes,
      newRelatedSource,
      newRelatedNotes,
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
