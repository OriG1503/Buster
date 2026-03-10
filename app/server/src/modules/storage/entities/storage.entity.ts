import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

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
}
