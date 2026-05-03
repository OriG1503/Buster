import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { LoggerService } from '../../../../shared/services/logger/logger.service';
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
    private readonly _logger: LoggerService,
  ) {}

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() dto: ResolveCrossEntityConflictDto): Promise<void> {
    //LOG
    this._logger.info(
      `CrossEntityConflictController.resolve — PATCH /api/conflicts/cross-entity/resolve conflictId=${dto.conflictId} winner="${dto.winnerValue}" applyToRobot=${dto.applyToRobot}`,
      'app-workflow',
    );
    return this._resolverService.resolve(dto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('revert')
  public async revert(@Body() dto: RevertCrossEntityConflictDto): Promise<void> {
    //LOG
    this._logger.info(
      `CrossEntityConflictController.revert — PATCH /api/conflicts/cross-entity/revert "${dto.tableName}/${dto.entityId}/${dto.columnName}" → "${dto.revertValue}"`,
      'app-workflow',
    );
    return this._resolverService.revert(dto);
  }

  @Get('history')
  public async history(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
    @Query('columnName') columnName: string,
  ): Promise<CrossEntityHistoryResponse> {
    //LOG
    this._logger.info(
      `CrossEntityConflictController.history — GET /api/conflicts/cross-entity/history "${tableName}/${entityId}/${columnName}"`,
      'app-workflow',
    );
    return this._historyService.getHistory(tableName, entityId, columnName);
  }
}
