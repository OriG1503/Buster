import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../shared/services/base.service';
import { SensorRepository } from './sensor.repository';
import { SensorEntity } from './entities/sensor.entity';
import { SensorInsertData } from './types/sensor-insert-data.type';

@Injectable()
export class SensorService extends BaseService<SensorEntity, SensorInsertData> {
  public readonly tableName = 'sensors';

  public constructor(repository: SensorRepository) {
    super(repository);
  }
}
