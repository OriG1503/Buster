import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { RobotEntity } from './entities/robot.entity';

@Injectable()
export class RobotRepository extends BaseRepository<RobotEntity> {
  public constructor(
    @InjectRepository(RobotEntity)
    repository: Repository<RobotEntity>,
  ) {
    super(repository);
  }
}
