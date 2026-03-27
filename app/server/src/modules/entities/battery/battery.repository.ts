import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { BatteryEntity } from './entities/battery.entity';

@Injectable()
export class BatteryRepository extends BaseRepository<BatteryEntity> {
  public constructor(
    @InjectRepository(BatteryEntity)
    repository: Repository<BatteryEntity>,
  ) {
    super(repository);
  }
}
