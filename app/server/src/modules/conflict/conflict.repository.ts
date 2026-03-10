import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { ConflictEntity } from './entities/conflict.entity';

@Injectable()
export class ConflictRepository extends BaseRepository<ConflictEntity, number> {
  public constructor(
    @InjectRepository(ConflictEntity)
    repository: Repository<ConflictEntity>,
  ) {
    super(repository);
  }
}
