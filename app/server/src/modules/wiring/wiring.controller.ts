import { Controller } from '@nestjs/common';
import { WiringService } from './wiring.service';

@Controller('wiring')
export class WiringController {
  public constructor(private readonly _wiringService: WiringService) {}
}
