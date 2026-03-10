import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationEntity } from './entities/communication.entity';

@Injectable()
export class CommunicationService {
  public constructor(
    @InjectRepository(CommunicationEntity)
    private readonly _communicationRepository: Repository<CommunicationEntity>,
  ) {}
}
