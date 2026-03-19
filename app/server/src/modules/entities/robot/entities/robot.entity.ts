import { Entity, OneToOne, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { CardboardEntity } from '../../cardboard/entities/cardboard.entity';
import { SensorEntity } from '../../sensor/entities/sensor.entity';
import { CommunicationEntity } from '../../communication/entities/communication.entity';
import { SaleEntity } from '../../sale/entities/sale.entity';
import { WiringEntity } from '../../wiring/entities/wiring.entity';

@Entity('robots')
export class RobotEntity extends BaseEntity {
  @OneToOne(() => CardboardEntity, (cardboard) => cardboard.robot, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'cardboardId' })
  public cardboard: CardboardEntity | null;

  @RelationId((robot: RobotEntity) => robot.cardboard)
  public cardboardId: string | null;

  @OneToOne(() => SensorEntity, (sensor) => sensor.robot, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sensorId' })
  public sensor: SensorEntity | null;

  @RelationId((robot: RobotEntity) => robot.sensor)
  public sensorId: string | null;

  @OneToOne(() => CommunicationEntity, (communication) => communication.robot, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'communicationId' })
  public communication: CommunicationEntity | null;

  @RelationId((robot: RobotEntity) => robot.communication)
  public communicationId: string | null;

  @OneToOne(() => SaleEntity, (sale) => sale.robot, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  public sale: SaleEntity | null;

  @RelationId((robot: RobotEntity) => robot.sale)
  public saleId: string | null;

  @ManyToOne(() => WiringEntity, (wiring) => wiring.robots, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'wiringId' })
  public wiring: WiringEntity | null;

  @RelationId((robot: RobotEntity) => robot.wiring)
  public wiringId: string | null;
}
