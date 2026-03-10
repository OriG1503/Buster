import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorEntity } from './entities/sensor.entity';

@Injectable()
export class SensorService {
  public constructor(
    @InjectRepository(SensorEntity)
    private readonly _sensorRepository: Repository<SensorEntity>,
  ) {}
}
