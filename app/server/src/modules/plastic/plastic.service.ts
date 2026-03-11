import { Injectable } from '@nestjs/common';
import { BaseService } from '../../shared/services/base.service';
import { PlasticRepository } from './plastic.repository';
import { PlasticEntity } from './entities/plastic.entity';
import { PlasticInsertData } from './types/plastic-insert-data.type';

@Injectable()
export class PlasticService extends BaseService<PlasticEntity, PlasticInsertData> {
  public constructor(repository: PlasticRepository) {
    super(repository);
  }
}
