import { Injectable } from '@nestjs/common';
import { CardboardRepository } from './cardboard.repository';

@Injectable()
export class CardboardService {
  public constructor(private readonly _repository: CardboardRepository) {}
}
