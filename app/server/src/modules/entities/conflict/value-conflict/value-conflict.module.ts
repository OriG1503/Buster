import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityServiceRegistryModule } from '../../../../shared/modules/entity-service-registry.module';
import { ValueConflictEntity } from './entities/value-conflict.entity';
import { ValueConflictController } from './value-conflict.controller';
import { ValueConflictRepository } from './value-conflict.repository';
import { ValueConflictService } from './services/value-conflict.service';
import { ValueConflictResolverService } from './services/value-conflict-resolver.service';
import { ValueConflictHistoryService } from './services/value-conflict-history.service';
import { ValueConflictEntityDetailService } from './services/value-conflict-entity-detail.service';
import { RevertService } from './services/revert.service';

@Module({
  imports: [TypeOrmModule.forFeature([ValueConflictEntity]), EntityServiceRegistryModule],
  controllers: [ValueConflictController],
  providers: [
    ValueConflictRepository,
    ValueConflictService,
    ValueConflictResolverService,
    ValueConflictHistoryService,
    ValueConflictEntityDetailService,
    RevertService,
  ],
  exports: [
    ValueConflictRepository,
    ValueConflictService,
    ValueConflictResolverService,
    ValueConflictHistoryService,
    ValueConflictEntityDetailService,
    RevertService,
  ],
})
export class ValueConflictModule {}
