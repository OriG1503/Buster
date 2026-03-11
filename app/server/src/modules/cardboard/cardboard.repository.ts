import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { CardboardEntity } from './entities/cardboard.entity';

@Injectable()
export class CardboardRepository extends BaseRepository<CardboardEntity> {
  public constructor(
    @InjectRepository(CardboardEntity)
    repository: Repository<CardboardEntity>,
  ) {
    super(repository);
  }
}
