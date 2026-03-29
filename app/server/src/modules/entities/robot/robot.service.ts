import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../shared/services/base.service';
import { RobotRepository } from './robot.repository';
import { RobotEntity } from './entities/robot.entity';
import { RobotInsertData } from './types/robot-insert-data.type';

@Injectable()
export class RobotService extends BaseService<RobotEntity, RobotInsertData> {
  public readonly tableName = 'robots';

  public constructor(repository: RobotRepository) {
    super(repository);
  }

  public findManyByWiringId(wiringId: string): Promise<RobotEntity[]> {
    return (this._repository as RobotRepository).findManyByWiringId(wiringId);
  }
}
