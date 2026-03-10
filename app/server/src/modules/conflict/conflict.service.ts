import { Injectable } from '@nestjs/common';
import { ConflictRepository } from './conflict.repository';

@Injectable()
export class ConflictService {
  public constructor(private readonly _repository: ConflictRepository) {}
}
