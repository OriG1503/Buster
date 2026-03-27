import { Module } from '@nestjs/common';
import { EntityServiceRegistryModule } from '../../shared/modules/entity-service-registry.module';
import { ConflictModule } from '../entities/conflict/conflict.module';
import { DataProcessorService } from './services/data-processor.service';
import { ParserRowMapper } from './mappers/parser-row.mapper';
import { ParsedRowEnricher } from './services/parsed-row-enricher.service';
import { ProcessReportService } from './services/process-report.service';

@Module({
  imports: [EntityServiceRegistryModule, ConflictModule],
  providers: [DataProcessorService, ParserRowMapper, ParsedRowEnricher, ProcessReportService],
  exports: [DataProcessorService, ProcessReportService],
})
export class DataProcessorModule {}
