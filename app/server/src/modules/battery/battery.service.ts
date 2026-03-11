import { Injectable } from '@nestjs/common';
import { BatteryRepository } from './battery.repository';

@Injectable()
export class BatteryService {
  public constructor(private readonly _repository: BatteryRepository) {}
}
