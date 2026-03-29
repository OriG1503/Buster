import { Controller, Get } from '@nestjs/common';
import { EntityCatalogService } from './entity-catalog.service';
import { EntityCatalogConfig } from '../../shared/consts/entity-configs.const';
import { Public } from '../auth/decorators/public.decorator';

@Controller('entity-catalog')
export class EntityCatalogController {
  public constructor(private readonly _entityCatalogService: EntityCatalogService) {}

  @Public()
  @Get()
  public getConfigs(): EntityCatalogConfig {
    return this._entityCatalogService.getConfigs();
  }
}
