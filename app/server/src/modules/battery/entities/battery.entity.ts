import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('batteries')
export class BatteryEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public sku: string | null;

  @Column({ type: 'varchar', nullable: true })
  public batteryType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public batteryVersion: string | null;

  @Column({ type: 'varchar', nullable: true })
  public lithiumVersion: string | null;
}
