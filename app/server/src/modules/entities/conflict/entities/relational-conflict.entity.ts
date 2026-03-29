import { Column, Entity, Index } from 'typeorm';
import { GeneratedBaseEntity } from '../../../../shared/entities/generated-base.entity';
import { RelationalConflictType } from '../consts/relational-conflict-type.const';
import { RelationalConflictSnapshot } from '../types/relational-conflict-snapshot.type';

@Entity('relational_conflicts')
@Index(['conflictType', 'anchorId', 'anchorTable', 'oldRelatedId', 'newRelatedId'], { unique: true, where: '"isSolved" = false' })
export class RelationalConflictEntity extends GeneratedBaseEntity {
  @Column({ type: 'varchar' })
  public conflictType: RelationalConflictType;

  @Column({ type: 'varchar' })
  public anchorId: string;

  @Column({ type: 'varchar' })
  public anchorTable: string;

  @Column({ type: 'varchar', nullable: true })
  public anchorSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public anchorNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public anchorSourceTime: string | null;

  @Column({ type: 'varchar' })
  public oldRelatedId: string;

  @Column({ type: 'varchar' })
  public newRelatedId: string;

  @Column({ type: 'varchar' })
  public relatedTable: string;

  @Column({ type: 'varchar', nullable: true })
  public oldRelatedSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldRelatedNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldRelatedSourceTime: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newRelatedSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newRelatedNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newRelatedSourceTime: string | null;

  @Column({ type: 'jsonb', nullable: true })
  public snapshot: RelationalConflictSnapshot | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictCreator: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictResolver: string | null;

  @Column({ type: 'varchar', nullable: true })
  public resolutionNotes: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isSolved: boolean | null;
}
