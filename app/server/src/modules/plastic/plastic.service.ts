import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlasticEntity } from './entities/plastic.entity';

@Injectable()
export class PlasticService {
  public constructor(
    @InjectRepository(PlasticEntity)
    private readonly _plasticRepository: Repository<PlasticEntity>,
  ) {}
}
