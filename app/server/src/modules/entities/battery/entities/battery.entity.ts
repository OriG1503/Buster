import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { PlasticEntity } from '../../plastic/entities/plastic.entity';

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

  @Column({ type: 'varchar', nullable: true })
  public batteryName: string | null;

  @Column({ type: 'varchar', nullable: true })
  public salesperson: string | null;

  @OneToOne(() => PlasticEntity, (plastic) => plastic.battery, { nullable: true })
  public plastic: PlasticEntity | null;
}
