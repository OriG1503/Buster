import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('cardboards')
export class CardboardEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  public cardboardType: string | null;

  @Column({ type: 'varchar', nullable: true })
  public cardboardVersion: string | null;
}
