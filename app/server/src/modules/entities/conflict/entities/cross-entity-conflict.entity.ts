import { Column, Entity, Index } from 'typeorm';
import { GeneratedBaseEntity } from '../../../../shared/entities/generated-base.entity';

@Entity('cross_entity_conflicts')
@Index(['wiringId', 'robotId', 'fieldName'], { unique: true, where: '"isSolved" = false AND "deletedAt" IS NULL' })
export class CrossEntityConflictEntity extends GeneratedBaseEntity {
  @Column({ type: 'varchar' })
  public wiringId: string;

  @Column({ type: 'varchar' })
  public robotId: string;

  @Column({ type: 'varchar' })
  public fieldName: string;

  @Column({ type: 'varchar', nullable: true })
  public wiringValue: string | null;

  @Column({ type: 'varchar', nullable: true })
  public robotValue: string | null;

  @Column({ type: 'varchar', nullable: true })
  public wiringSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public robotSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  public wiringNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public robotNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  public wiringSourceTime: string | null;

  @Column({ type: 'varchar', nullable: true })
  public robotSourceTime: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isSolved: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictCreator: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictResolver: string | null;

  @Column({ type: 'varchar', nullable: true })
  public resolutionNotes: string | null;
}
