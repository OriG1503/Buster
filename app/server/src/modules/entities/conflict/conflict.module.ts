import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValueConflictEntity } from './entities/value-conflict.entity';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';
import { CrossEntityConflictEntity } from './entities/cross-entity-conflict.entity';
import { ValueConflictRepository } from './value-conflict.repository';
import { RelationalConflictRepository } from './relational-conflict.repository';
import { CrossEntityConflictRepository } from './cross-entity-conflict.repository';
import { ValueConflictService } from './services/value-conflict.service';
import { ValueConflictHistoryService } from './value-conflict-history.service';
import { ValueConflictResolverService } from './services/value-conflict-resolver.service';
import { RelationalConflictDetectionService } from './services/relational-conflict-detection.service';
import { RelationalConflictResolverService } from './services/relational-conflict-resolver.service';
import { CrossEntityConflictDetectionService } from './services/cross-entity-conflict-detection.service';
import { CrossEntityConflictResolverService } from './services/cross-entity-conflict-resolver.service';
import { SnapshotBuilderService } from './services/snapshot-builder.service';
import { ConflictController } from './conflict.controller';
import { EntityServiceRegistryModule } from '../../../shared/modules/entity-service-registry.module';
import { RevertService } from './services/revert.service';
import { ValueConflictListService } from './services/value-conflict-list.service';
import { ValueConflictEntityDetailService } from './services/value-conflict-entity-detail.service';
import { ConflictListService } from './services/conflict-list.service';
import { ConflictEntityDetailService } from './services/conflict-entity-detail.service';
import { RelationalConflictHistoryService } from './relational-conflict-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ValueConflictEntity, RelationalConflictEntity, CrossEntityConflictEntity]),
    EntityServiceRegistryModule,
  ],
  controllers: [ConflictController],
  providers: [
    ValueConflictRepository,
    RelationalConflictRepository,
    CrossEntityConflictRepository,
    ValueConflictService,
    ValueConflictResolverService,
    RelationalConflictDetectionService,
    RelationalConflictResolverService,
    CrossEntityConflictDetectionService,
    CrossEntityConflictResolverService,
    SnapshotBuilderService,
    RevertService,
    ValueConflictHistoryService,
    ValueConflictListService,
    ValueConflictEntityDetailService,
    ConflictListService,
    ConflictEntityDetailService,
    RelationalConflictHistoryService,
  ],
  exports: [ValueConflictRepository, ValueConflictService, RelationalConflictDetectionService, CrossEntityConflictDetectionService],
})
export class ConflictModule {}
