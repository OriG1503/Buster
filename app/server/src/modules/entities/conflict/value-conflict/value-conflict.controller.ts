import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { RequireRole } from '../../../auth/decorators/require-role.decorator';
import { Role } from '../../../auth/types/role.type';
import { ValueConflictResolverService } from './services/value-conflict-resolver.service';
import { ValueConflictHistoryService } from './services/value-conflict-history.service';
import { RevertService } from './services/revert.service';
import { ResolveValueConflictDto } from './dto/resolve-value-conflict.dto';
import { RevertValueConflictDto } from './dto/revert-value-conflict.dto';
import { ConflictHistoryResponse } from './types/conflict-history-response.type';

@RequireRole(Role.VIEWER)
@Controller('conflicts/value')
export class ValueConflictController {
  public constructor(
    private readonly _resolverService: ValueConflictResolverService,
    private readonly _historyService: ValueConflictHistoryService,
    private readonly _revertService: RevertService,
  ) {}

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() dto: ResolveValueConflictDto): Promise<BaseEntity> {
    return this._resolverService.resolve(dto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('revert')
  public async revert(@Body() dto: RevertValueConflictDto): Promise<BaseEntity> {
    return this._revertService.revert(dto);
  }

  @Get('history')
  public async history(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
    @Query('columnName') columnName: string,
  ): Promise<ConflictHistoryResponse> {
    return this._historyService.getHistory(tableName, entityId, columnName);
  }
}
