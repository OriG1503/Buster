import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../shared/services/base.service';
import { CommunicationRepository } from './communication.repository';
import { CommunicationEntity } from './entities/communication.entity';
import { CommunicationInsertData } from './types/communication-insert-data.type';

@Injectable()
export class CommunicationService extends BaseService<CommunicationEntity, CommunicationInsertData> {
  public readonly tableName = 'communications';

  public constructor(repository: CommunicationRepository) {
    super(repository);
  }
}
