import { Controller } from '@nestjs/common';
import { RobotService } from './robot.service';

@Controller('robot')
export class RobotController {
  public constructor(private readonly _robotService: RobotService) {}
}
