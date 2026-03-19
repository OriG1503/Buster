import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { WiringEntity } from './entities/wiring.entity';

@Injectable()
export class WiringRepository extends BaseRepository<WiringEntity> {
  public constructor(
    @InjectRepository(WiringEntity)
    repository: Repository<WiringEntity>,
  ) {
    super(repository);
  }
}
