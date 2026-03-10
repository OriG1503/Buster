import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { IronEntity } from './entities/iron.entity';

@Injectable()
export class IronRepository extends BaseRepository<IronEntity> {
  public constructor(
    @InjectRepository(IronEntity)
    repository: Repository<IronEntity>,
  ) {
    super(repository);
  }
}
