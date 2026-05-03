import { Controller, Get } from '@nestjs/common';
import { LoggerService } from '../../shared/services/logger/logger.service';
import { EntityCatalogService } from './entity-catalog.service';
import { EntityCatalogConfig } from '../../shared/consts/entity-configs.const';
import { Public } from '../auth/decorators/public.decorator';

@Controller('entity-catalog')
export class EntityCatalogController {
  public constructor(
    private readonly _entityCatalogService: EntityCatalogService,
    private readonly _logger: LoggerService,
  ) {}

  @Public()
  @Get()
  public getConfigs(): EntityCatalogConfig {
    this._logger.info('EntityCatalogController.getConfigs — GET /api/entity-catalog', 'app-workflow');
    return this._entityCatalogService.getConfigs();
  }
}
