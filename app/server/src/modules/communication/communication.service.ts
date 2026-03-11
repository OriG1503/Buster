import { Injectable } from '@nestjs/common';
import { CommunicationRepository } from './communication.repository';

@Injectable()
export class CommunicationService {
  public constructor(private readonly _repository: CommunicationRepository) {}
}
