import { Column, Entity, OneToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { BatteryEntity } from '../../battery/entities/battery.entity';
import { CommunicationEntity } from '../../communication/entities/communication.entity';

@Entity('plastics')
export class PlasticEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public plasticType: string | null;

  @OneToOne(() => BatteryEntity, (battery) => battery.plastic, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'batteryId' })
  public battery: BatteryEntity | null;

  @RelationId((plastic: PlasticEntity) => plastic.battery)
  public batteryId: string | null;

  @OneToOne(() => CommunicationEntity, (communication) => communication.plastic)
  public communication: CommunicationEntity | null;
}
