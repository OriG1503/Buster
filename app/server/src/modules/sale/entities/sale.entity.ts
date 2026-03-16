import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RobotEntity } from '../../robot/entities/robot.entity';

@Entity('sales')
export class SaleEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public carrier: string | null;

  @Column({ type: 'varchar', nullable: true })
  public onlineStoreName: string | null;

  @Column({ type: 'varchar', nullable: true })
  public salesperson: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isPurchased: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  public isStockAshdod: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  public isStockTelAviv: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  public isStockRehovot: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  public dataSource: string | null;

  @OneToOne(() => RobotEntity, (robot) => robot.sale)
  public robot: RobotEntity | null;
}
