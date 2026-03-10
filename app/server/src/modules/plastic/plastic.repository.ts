import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { PlasticEntity } from './entities/plastic.entity';

@Injectable()
export class PlasticRepository extends BaseRepository<PlasticEntity> {
  public constructor(
    @InjectRepository(PlasticEntity)
    repository: Repository<PlasticEntity>,
  ) {
    super(repository);
  }
}
