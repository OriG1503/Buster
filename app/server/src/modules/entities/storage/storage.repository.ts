import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { StorageEntity } from './entities/storage.entity';

@Injectable()
export class StorageRepository extends BaseRepository<StorageEntity> {
  public constructor(
    @InjectRepository(StorageEntity)
    repository: Repository<StorageEntity>,
  ) {
    super(repository);
  }
}
