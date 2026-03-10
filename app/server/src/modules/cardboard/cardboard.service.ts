import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardboardEntity } from './entities/cardboard.entity';

@Injectable()
export class CardboardService {
  public constructor(
    @InjectRepository(CardboardEntity)
    private readonly _cardboardRepository: Repository<CardboardEntity>,
  ) {}
}
