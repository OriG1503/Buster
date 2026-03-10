import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WiringEntity } from './entities/wiring.entity';

@Injectable()
export class WiringService {
  public constructor(
    @InjectRepository(WiringEntity)
    private readonly _wiringRepository: Repository<WiringEntity>,
  ) {}
}
