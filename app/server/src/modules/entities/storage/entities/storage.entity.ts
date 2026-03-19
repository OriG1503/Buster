import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { WiringEntity } from '../../wiring/entities/wiring.entity';

@Entity('storages')
export class StorageEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public storageType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public storageVersion: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isStockNetanya: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  public isStockAfula: boolean | null;

  @OneToOne(() => WiringEntity, (wiring) => wiring.storage)
  public wiring: WiringEntity | null;
}
