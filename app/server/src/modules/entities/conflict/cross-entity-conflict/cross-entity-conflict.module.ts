import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityServiceRegistryModule } from '../../../../shared/modules/entity-service-registry.module';
import { ValueConflictModule } from '../value-conflict/value-conflict.module';
import { CrossEntityConflictEntity } from './entities/cross-entity-conflict.entity';
import { CrossEntityConflictController } from './cross-entity-conflict.controller';
import { CrossEntityConflictRepository } from './cross-entity-conflict.repository';
import { CrossEntityConflictDetectionService } from './services/cross-entity-conflict-detection.service';
import { CrossEntityConflictResolverService } from './services/cross-entity-conflict-resolver.service';
import { CrossEntityConflictHistoryService } from './services/cross-entity-conflict-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([CrossEntityConflictEntity]), EntityServiceRegistryModule, ValueConflictModule],
  controllers: [CrossEntityConflictController],
  providers: [
    CrossEntityConflictRepository,
    CrossEntityConflictDetectionService,
    CrossEntityConflictResolverService,
    CrossEntityConflictHistoryService,
  ],
  exports: [
    CrossEntityConflictRepository,
    CrossEntityConflictDetectionService,
    CrossEntityConflictResolverService,
    CrossEntityConflictHistoryService,
  ],
})
export class CrossEntityConflictModule {}
