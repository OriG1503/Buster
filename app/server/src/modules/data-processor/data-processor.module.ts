import { Module } from '@nestjs/common';
import { EntityServiceRegistryModule } from '../../shared/modules/entity-service-registry.module';
import { ConflictModule } from '../conflict/conflict.module';
import { DataProcessorService } from './data-processor.service';
import { ParserRowMapper } from './mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';

@Module({
  imports: [EntityServiceRegistryModule, ConflictModule],
  providers: [DataProcessorService, ParserRowMapper, ParsedRowEnricher],
  exports: [DataProcessorService],
})
export class DataProcessorModule {}
