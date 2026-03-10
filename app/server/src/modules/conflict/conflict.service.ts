import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictEntity } from './entities/conflict.entity';

@Injectable()
export class ConflictService {
  public constructor(
    @InjectRepository(ConflictEntity)
    private readonly _conflictRepository: Repository<ConflictEntity>,
  ) {}
}
