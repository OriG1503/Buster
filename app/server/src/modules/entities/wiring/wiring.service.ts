import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../shared/services/base.service';
import { WiringRepository } from './wiring.repository';
import { WiringEntity } from './entities/wiring.entity';
import { WiringInsertData } from './types/wiring-insert-data.type';

@Injectable()
export class WiringService extends BaseService<WiringEntity, WiringInsertData> {
  public readonly tableName = 'wirings';

  public constructor(repository: WiringRepository) {
    super(repository);
  }
}
