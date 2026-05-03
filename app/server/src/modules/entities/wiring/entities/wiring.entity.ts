import { Column, Entity, OneToOne, OneToMany, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { StorageEntity } from '../../storage/entities/storage.entity';
import { RobotEntity } from '../../robot/entities/robot.entity';

@Entity('wirings')
export class WiringEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public wiringType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public district: string | null;

  @Column({ type: 'varchar', nullable: true })
  public storeName: string | null;

  @OneToOne(() => StorageEntity, (storage) => storage.wiring, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'storageId' })
  public storage: StorageEntity | null;

  @RelationId((wiring: WiringEntity) => wiring.storage)
  public storageId: string | null;

  @OneToMany(() => RobotEntity, (robot) => robot.wiring)
  public robots: RobotEntity[];
}
