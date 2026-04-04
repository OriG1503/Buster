import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { RequireRole } from '../../../auth/decorators/require-role.decorator';
import { Role } from '../../../auth/types/role.type';
import { CrossEntityConflictResolverService } from './services/cross-entity-conflict-resolver.service';
import { CrossEntityConflictHistoryService } from './services/cross-entity-conflict-history.service';
import { ResolveCrossEntityConflictDto } from './dto/resolve-cross-entity-conflict.dto';
import { RevertCrossEntityConflictDto } from './dto/revert-cross-entity-conflict.dto';
import { CrossEntityHistoryResponse } from './types/cross-entity-history-response.type';

@RequireRole(Role.VIEWER)
@Controller('conflicts/cross-entity')
export class CrossEntityConflictController {
  public constructor(
    private readonly _resolverService: CrossEntityConflictResolverService,
    private readonly _historyService: CrossEntityConflictHistoryService,
  ) {}

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() dto: ResolveCrossEntityConflictDto): Promise<void> {
    return this._resolverService.resolve(dto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('revert')
  public async revert(@Body() dto: RevertCrossEntityConflictDto): Promise<void> {
    return this._resolverService.revert(dto);
  }

  @Get('history')
  public async history(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
    @Query('columnName') columnName: string,
  ): Promise<CrossEntityHistoryResponse> {
    return this._historyService.getHistory(tableName, entityId, columnName);
  }
}
