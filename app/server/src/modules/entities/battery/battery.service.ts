import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../shared/services/base.service';
import { BatteryRepository } from './battery.repository';
import { BatteryEntity } from './entities/battery.entity';
import { BatteryInsertData } from './types/battery-insert-data.type';

@Injectable()
export class BatteryService extends BaseService<BatteryEntity, BatteryInsertData> {
  public readonly tableName = 'batteries';

  public constructor(repository: BatteryRepository) {
    super(repository);
  }
}
