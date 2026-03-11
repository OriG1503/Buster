import { Injectable } from '@nestjs/common';
import { BaseService } from '../../shared/services/base.service';
import { CardboardRepository } from './cardboard.repository';
import { CardboardEntity } from './entities/cardboard.entity';
import { CardboardInsertData } from './types/cardboard-insert-data.type';

@Injectable()
export class CardboardService extends BaseService<CardboardEntity, CardboardInsertData> {
  public constructor(repository: CardboardRepository) {
    super(repository);
  }
}
