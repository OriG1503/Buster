import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('sensors')
export class SensorEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public sensorType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public sensorVersion: string | null;
}
