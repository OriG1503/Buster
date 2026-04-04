import { Module } from '@nestjs/common';
import { EntityServiceRegistryModule } from '../../shared/modules/entity-service-registry.module';
import { EntityCatalogModule } from '../entity-catalog/entity-catalog.module';
import { ConflictModule } from '../entities/conflict/conflict.module';
import { RobotModule } from '../entities/robot/robot.module';
import { CommunicationModule } from '../entities/communication/communication.module';
import { PlasticModule } from '../entities/plastic/plastic.module';
import { WiringModule } from '../entities/wiring/wiring.module';
import { FictiveModule } from '../fictive/fictive.module';
import { DataProcessorService } from './services/data-processor.service';
import { EntityIngestionService } from './services/entity-ingestion.service';
import { EntityInsertService } from './services/entity-insert.service';
import { EntityUpdateService } from './services/entity-update.service';
import { FkConflictService } from './services/fk-conflict.service';
import { ParserRowMapper } from './mappers/parser-row.mapper';
import { ParsedRowEnricher } from './services/parsed-row-enricher.service';
import { ProcessReportService } from './services/process-report.service';

@Module({
  imports: [EntityServiceRegistryModule, EntityCatalogModule, ConflictModule, FictiveModule, RobotModule, CommunicationModule, PlasticModule, WiringModule],
  providers: [
    DataProcessorService,
    EntityIngestionService,
    EntityInsertService,
    EntityUpdateService,
    FkConflictService,
    ParserRowMapper,
    ParsedRowEnricher,
    ProcessReportService,
  ],
  exports: [DataProcessorService, ProcessReportService],
})
export class DataProcessorModule {}
