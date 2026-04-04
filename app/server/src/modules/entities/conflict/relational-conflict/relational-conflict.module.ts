import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityServiceRegistryModule } from '../../../../shared/modules/entity-service-registry.module';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';
import { RelationalConflictController } from './relational-conflict.controller';
import { RelationalConflictRepository } from './relational-conflict.repository';
import { RelationalConflictDetectionService } from './services/relational-conflict-detection.service';
import { RelationalConflictResolverService } from './services/relational-conflict-resolver.service';
import { RelationalConflictHistoryService } from './services/relational-conflict-history.service';
import { SnapshotBuilderService } from './services/snapshot-builder.service';

@Module({
  imports: [TypeOrmModule.forFeature([RelationalConflictEntity]), EntityServiceRegistryModule],
  controllers: [RelationalConflictController],
  providers: [
    RelationalConflictRepository,
    SnapshotBuilderService,
    RelationalConflictDetectionService,
    RelationalConflictResolverService,
    RelationalConflictHistoryService,
  ],
  exports: [
    RelationalConflictRepository,
    RelationalConflictDetectionService,
    RelationalConflictResolverService,
    RelationalConflictHistoryService,
  ],
})
export class RelationalConflictModule {}
