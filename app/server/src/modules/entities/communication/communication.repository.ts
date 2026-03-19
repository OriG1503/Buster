import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { CommunicationEntity } from './entities/communication.entity';

@Injectable()
export class CommunicationRepository extends BaseRepository<CommunicationEntity> {
  public constructor(
    @InjectRepository(CommunicationEntity)
    repository: Repository<CommunicationEntity>,
  ) {
    super(repository);
  }
}
