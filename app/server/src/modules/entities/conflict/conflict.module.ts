import { Module } from '@nestjs/common';
import { ValueConflictModule } from './value-conflict/value-conflict.module';
import { RelationalConflictModule } from './relational-conflict/relational-conflict.module';
import { CrossEntityConflictModule } from './cross-entity-conflict/cross-entity-conflict.module';
import { ConflictController } from './conflict.controller';
import { ConflictListService } from './services/conflict-list.service';
import { ConflictEntityDetailService } from './services/conflict-entity-detail.service';

@Module({
  imports: [ValueConflictModule, RelationalConflictModule, CrossEntityConflictModule],
  controllers: [ConflictController],
  providers: [ConflictListService, ConflictEntityDetailService],
})
export class ConflictModule {}
