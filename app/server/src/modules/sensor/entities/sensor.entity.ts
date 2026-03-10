import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RobotEntity } from '../../robot/entities/robot.entity';

@Entity('sensors')
export class SensorEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public sensorType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public sensorVersion: string | null;

  @OneToOne(() => RobotEntity, (robot) => robot.sensor)
  public robot: RobotEntity | null;
}
