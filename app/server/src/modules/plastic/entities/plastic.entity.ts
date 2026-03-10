import { Column, Entity, OneToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { BatteryEntity } from '../../battery/entities/battery.entity';

@Entity('plastics')
export class PlasticEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public plasticType: string | null;

  @OneToOne(() => BatteryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batteryId' })
  public battery: BatteryEntity | null;

  @RelationId((plastic: PlasticEntity) => plastic.battery)
  public batteryId: string | null;
}
