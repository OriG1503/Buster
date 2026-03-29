import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { RobotEntity } from './entities/robot.entity';

@Injectable()
export class RobotRepository extends BaseRepository<RobotEntity> {
  public constructor(
    @InjectRepository(RobotEntity)
    repository: Repository<RobotEntity>,
  ) {
    super(repository);
  }

  public findManyByWiringId(wiringId: string): Promise<RobotEntity[]> {
    return this._repository
      .createQueryBuilder('r')
      .where('r."wiringId" = :wiringId', { wiringId })
      .loadAllRelationIds()
      .getMany();
  }
}
