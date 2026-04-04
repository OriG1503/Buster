import { Module } from '@nestjs/common';
import { ValueConflictModule } from '../entities/conflict/value-conflict/value-conflict.module';
import { RelationalConflictModule } from '../entities/conflict/relational-conflict/relational-conflict.module';
import { EntityServiceRegistryModule } from '../../shared/modules/entity-service-registry.module';
import { FictiveReplacementService } from './services/fictive-replacement.service';
import { ConflictReattributionService } from './services/conflict-reattribution.service';
import { FictiveDataTransferService } from './services/fictive-data-transfer.service';
import { FictiveIdService } from './services/fictive-id.service';
import { FictiveParentRedirectService } from './services/fictive-parent-redirect.service';

@Module({
  imports: [ValueConflictModule, RelationalConflictModule, EntityServiceRegistryModule],
  providers: [FictiveReplacementService, ConflictReattributionService, FictiveDataTransferService, FictiveParentRedirectService, FictiveIdService],
  exports: [FictiveReplacementService, ConflictReattributionService, FictiveIdService],
})
export class FictiveModule {}
