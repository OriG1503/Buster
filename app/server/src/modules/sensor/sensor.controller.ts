import { Controller } from '@nestjs/common';
import { SensorService } from './sensor.service';

@Controller('sensor')
export class SensorController {
  public constructor(private readonly _sensorService: SensorService) {}
}
