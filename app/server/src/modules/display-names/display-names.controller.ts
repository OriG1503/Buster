import { Controller, Get } from '@nestjs/common';
import { DisplayNamesService } from './display-names.service';
import { DisplayNamesConfig } from './types/display-names-config.type';
import { Public } from '../auth/decorators/public.decorator';

@Controller('display-names')
export class DisplayNamesController {
  public constructor(private readonly _displayNamesService: DisplayNamesService) {}

  @Public()
  @Get()
  public getConfig(): DisplayNamesConfig {
    return this._displayNamesService.getConfig();
  }
}
