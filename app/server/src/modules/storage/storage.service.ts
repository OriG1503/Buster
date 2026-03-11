import { Injectable } from '@nestjs/common';
import { BaseService } from '../../shared/services/base.service';
import { StorageRepository } from './storage.repository';
import { StorageEntity } from './entities/storage.entity';
import { StorageInsertData } from './types/storage-insert-data.type';

@Injectable()
export class StorageService extends BaseService<StorageEntity, StorageInsertData> {
  public constructor(repository: StorageRepository) {
    super(repository);
  }
}
