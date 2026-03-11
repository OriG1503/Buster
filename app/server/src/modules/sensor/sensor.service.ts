import { Injectable } from '@nestjs/common';
import { SensorRepository } from './sensor.repository';

@Injectable()
export class SensorService {
  public constructor(private readonly _repository: SensorRepository) {}
}
