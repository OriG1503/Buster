import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictRepository } from './conflict.repository';
import { ConflictService } from './services/conflict.service';
import { ConflictHistoryService } from './conflict-history.service';
import { ConflictResolverService } from './services/conflict-resolver.service';
import { ConflictController } from './conflict.controller';
import { EntityServiceRegistryModule } from '../../../shared/modules/entity-service-registry.module';
import { RevertService } from './services/revert.service';
import { ConflictListService } from './services/conflict-list.service';
import { ConflictEntityDetailService } from './services/conflict-entity-detail.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConflictEntity]), EntityServiceRegistryModule],
  controllers: [ConflictController],
  providers: [ConflictRepository, ConflictService, ConflictResolverService, RevertService, ConflictHistoryService, ConflictListService, ConflictEntityDetailService],
  exports: [ConflictRepository, ConflictService],
})
export class ConflictModule {}
