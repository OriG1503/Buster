import { Module } from '@nestjs/common';
import { ConflictModule } from '../entities/conflict/conflict.module';
import { EntityServiceRegistryModule } from '../../shared/modules/entity-service-registry.module';
import { FictiveReplacementService } from './services/fictive-replacement.service';
import { ConflictReattributionService } from './services/conflict-reattribution.service';
import { FictiveDataTransferService } from './services/fictive-data-transfer.service';
import { FictiveIdService } from './services/fictive-id.service';
import { FictiveParentRedirectService } from './services/fictive-parent-redirect.service';

@Module({
  imports: [ConflictModule, EntityServiceRegistryModule],
  providers: [FictiveReplacementService, ConflictReattributionService, FictiveDataTransferService, FictiveParentRedirectService, FictiveIdService],
  exports: [FictiveReplacementService, ConflictReattributionService, FictiveIdService],
})
export class FictiveModule {}
