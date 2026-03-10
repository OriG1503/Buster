import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageEntity } from './entities/storage.entity';

@Injectable()
export class StorageService {
  public constructor(
    @InjectRepository(StorageEntity)
    private readonly _storageRepository: Repository<StorageEntity>,
  ) {}
}
