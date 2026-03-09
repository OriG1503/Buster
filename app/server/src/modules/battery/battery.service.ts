import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatteryEntity } from './entities/battery.entity';

@Injectable()
export class BatteryService {
  public constructor(
    @InjectRepository(BatteryEntity)
    private readonly _batteryRepository: Repository<BatteryEntity>,
  ) {}
}
