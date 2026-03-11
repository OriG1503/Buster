import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { SensorEntity } from './entities/sensor.entity';

@Injectable()
export class SensorRepository extends BaseRepository<SensorEntity> {
  public constructor(
    @InjectRepository(SensorEntity)
    repository: Repository<SensorEntity>,
  ) {
    super(repository);
  }
}
