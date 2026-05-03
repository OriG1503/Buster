import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { LoggerService } from '../../../../shared/services/logger/logger.service';
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
    private readonly _logger: LoggerService,
  ) {}

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() dto: ResolveValueConflictDto): Promise<BaseEntity> {
    this._logger.info(
      `ValueConflictController.resolve — PATCH /api/conflicts/value/resolve "${dto.tableName}/${dto.entityId}/${dto.columnName}" → "${dto.winnerValue}"`,
      'app-workflow',
    );
    return this._resolverService.resolve(dto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('revert')
  public async revert(@Body() dto: RevertValueConflictDto): Promise<BaseEntity> {
    this._logger.info(
      `ValueConflictController.revert — PATCH /api/conflicts/value/revert "${dto.tableName}/${dto.entityId}/${dto.columnName}" → "${dto.revertValue}"`,
      'app-workflow',
    );
    return this._revertService.revert(dto);
  }

  @Get('history')
  public async history(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
    @Query('columnName') columnName: string,
  ): Promise<ConflictHistoryResponse> {
    this._logger.info(
      `ValueConflictController.history — GET /api/conflicts/value/history "${tableName}/${entityId}/${columnName}"`,
      'app-workflow',
    );
    return this._historyService.getHistory(tableName, entityId, columnName);
  }
}
