import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IronEntity } from './entities/iron.entity';

@Injectable()
export class IronService {
  public constructor(
    @InjectRepository(IronEntity)
    private readonly _ironRepository: Repository<IronEntity>,
  ) {}
}
