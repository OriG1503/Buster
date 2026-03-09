import { Controller } from '@nestjs/common';
import { BatteryService } from './battery.service';

@Controller('battery')
export class BatteryController {
  public constructor(private readonly _batteryService: BatteryService) {}
}
