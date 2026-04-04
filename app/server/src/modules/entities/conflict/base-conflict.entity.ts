import { Column } from 'typeorm';
import { GeneratedBaseEntity } from '../../../shared/entities/generated-base.entity';

export abstract class BaseConflictEntity extends GeneratedBaseEntity {
  @Column({ type: 'boolean', nullable: true })
  public isSolved: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictCreator: string | null;

  @Column({ type: 'varchar', nullable: true })
  public conflictResolver: string | null;

  @Column({ type: 'varchar', nullable: true })
  public resolutionNotes: string | null;
}
