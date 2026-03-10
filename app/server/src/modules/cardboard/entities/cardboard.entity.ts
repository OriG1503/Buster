import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RobotEntity } from '../../robot/entities/robot.entity';

@Entity('cardboards')
export class CardboardEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public cardboardType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public cardboardVersion: string | null;

  @OneToOne(() => RobotEntity, (robot) => robot.cardboard)
  public robot: RobotEntity | null;
}
