import { Column, Entity, Unique } from 'typeorm';
import { GeneratedBaseEntity } from '../../../shared/entities/generated-base.entity';

@Entity('conflicts')
@Unique(['tableName', 'columnName', 'entityId', 'newValue'])
export class ConflictEntity extends GeneratedBaseEntity {
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
  public oldValue: string | null;

  @Column({ type: 'varchar', nullable: true })
  public oldSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictCreator: string | null;

  @Column({ type: 'varchar', nullable: true })
  public notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictResolver: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isSolved: boolean | null;
}
