import { Controller } from '@nestjs/common';
import { IronService } from './iron.service';

@Controller('iron')
export class IronController {
  public constructor(private readonly _ironService: IronService) {}
}
