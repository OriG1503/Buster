import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValueConflictEntity } from './entities/conflict.entity';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';
import { ValueConflictRepository } from './conflict.repository';
import { RelationalConflictRepository } from './relational-conflict.repository';
import { ValueConflictService } from './services/conflict.service';
import { ValueConflictHistoryService } from './conflict-history.service';
import { ValueConflictResolverService } from './services/conflict-resolver.service';
import { RelationalConflictDetectionService } from './services/relational-conflict-detection.service';
import { RelationalConflictResolverService } from './services/relational-conflict-resolver.service';
import { SnapshotBuilderService } from './services/snapshot-builder.service';
import { ConflictController } from './conflict.controller';
import { EntityServiceRegistryModule } from '../../../shared/modules/entity-service-registry.module';
import { RevertService } from './services/revert.service';
import { ValueConflictListService } from './services/conflict-list.service';
import { ValueConflictEntityDetailService } from './services/conflict-entity-detail.service';

@Module({
  imports: [TypeOrmModule.forFeature([ValueConflictEntity, RelationalConflictEntity]), EntityServiceRegistryModule],
  controllers: [ConflictController],
  providers: [
    ValueConflictRepository,
    RelationalConflictRepository,
    ValueConflictService,
    ValueConflictResolverService,
    RelationalConflictDetectionService,
    RelationalConflictResolverService,
    SnapshotBuilderService,
    RevertService,
    ValueConflictHistoryService,
    ValueConflictListService,
    ValueConflictEntityDetailService,
  ],
  exports: [ValueConflictRepository, ValueConflictService, RelationalConflictDetectionService],
})
export class ConflictModule {}
