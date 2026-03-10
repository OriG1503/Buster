import { Column, Entity, OneToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { PlasticEntity } from '../../plastic/entities/plastic.entity';
import { IronEntity } from '../../iron/entities/iron.entity';
import { RobotEntity } from '../../robot/entities/robot.entity';

@Entity('communications')
export class CommunicationEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public communicationType: string | null;

  @OneToOne(() => PlasticEntity, (plastic) => plastic.communication, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plasticId' })
  public plastic: PlasticEntity | null;

  @RelationId((communication: CommunicationEntity) => communication.plastic)
  public plasticId: string | null;

  @OneToOne(() => IronEntity, (iron) => iron.communication, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ironId' })
  public iron: IronEntity | null;

  @RelationId((communication: CommunicationEntity) => communication.iron)
  public ironId: string | null;

  @OneToOne(() => RobotEntity, (robot) => robot.communication)
  public robot: RobotEntity | null;
}
