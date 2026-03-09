import { Controller } from '@nestjs/common';
import { PlasticService } from './plastic.service';

@Controller('plastic')
export class PlasticController {
  public constructor(private readonly _plasticService: PlasticService) {}
}
