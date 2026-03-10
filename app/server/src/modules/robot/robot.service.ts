import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RobotEntity } from './entities/robot.entity';

@Injectable()
export class RobotService {
  public constructor(
    @InjectRepository(RobotEntity)
    private readonly _robotRepository: Repository<RobotEntity>,
  ) {}
}
