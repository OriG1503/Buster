import { Column, Entity, Index } from 'typeorm';
import { BaseConflictEntity } from '../../base-conflict.entity';

@Entity('value_conflicts')
@Index(['tableName', 'columnName', 'entityId', 'newValue'], { unique: true, where: '"isSolved" = false' })
export class ValueConflictEntity extends BaseConflictEntity {
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
  public newSourceTime: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldValue: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldSourceTime: string | null;
}
