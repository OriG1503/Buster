import { Injectable } from '@nestjs/common';
import { RobotRepository } from './robot.repository';

@Injectable()
export class RobotService {
  public constructor(private readonly _repository: RobotRepository) {}
}
