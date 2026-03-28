import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DataProcessorModule } from '../data-processor/data-processor.module';
import { EntityCatalogModule } from '../entity-catalog/entity-catalog.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [HttpModule, DataProcessorModule, EntityCatalogModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
