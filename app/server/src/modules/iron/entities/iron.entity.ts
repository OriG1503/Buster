import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CommunicationEntity } from '../../communication/entities/communication.entity';

@Entity('irons')
export class IronEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public ironType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public ironVersion: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isHeatConductor: boolean | null;

  @OneToOne(() => CommunicationEntity, (communication) => communication.iron)
  public communication: CommunicationEntity | null;
}
