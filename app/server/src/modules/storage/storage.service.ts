import { Injectable } from '@nestjs/common';
import { StorageRepository } from './storage.repository';

@Injectable()
export class StorageService {
  public constructor(private readonly _repository: StorageRepository) {}
}
