import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../shared/services/base.service';
import { IronRepository } from './iron.repository';
import { IronEntity } from './entities/iron.entity';
import { IronInsertData } from './types/iron-insert-data.type';

@Injectable()
export class IronService extends BaseService<IronEntity, IronInsertData> {
  public readonly tableName = 'irons';

  public constructor(repository: IronRepository) {
    super(repository);
  }
}
