import { Column, Entity, Index } from 'typeorm';
import { GeneratedBaseEntity } from '../../../../shared/entities/generated-base.entity';

@Entity('value_conflicts')
@Index(['tableName', 'columnName', 'entityId', 'newValue'], { unique: true, where: '"isSolved" = false' })
export class ValueConflictEntity extends GeneratedBaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public tableName: string | null;

  @Column({ type: 'varchar', nullable: true })
  public columnName: string | null;

  @Column({ type: 'varchar', nullable: true })
  public entityId: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newValue: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldValue: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictCreator: string | null;

  @Column({ type: 'varchar', nullable: true })
  public resolutionNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictResolver: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isSolved: boolean | null;
}
