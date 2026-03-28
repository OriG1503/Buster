import { Module } from '@nestjs/common';
import { EntityCatalogController } from './entity-catalog.controller';
import { EntityCatalogService } from './entity-catalog.service';

@Module({
  controllers: [EntityCatalogController],
  providers: [EntityCatalogService],
  exports: [EntityCatalogService],
})
export class EntityCatalogModule {}
