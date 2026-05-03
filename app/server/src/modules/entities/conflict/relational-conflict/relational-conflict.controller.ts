import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { LoggerService } from '../../../../shared/services/logger/logger.service';
import { RequireRole } from '../../../auth/decorators/require-role.decorator';
import { Role } from '../../../auth/types/role.type';
import { RelationalConflictResolverService } from './services/relational-conflict-resolver.service';
import { RelationalConflictHistoryService } from './services/relational-conflict-history.service';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';
import { ResolveRelationalConflictDto } from './dto/resolve-relational-conflict.dto';
import { RelationalHistoryResponse } from './types/relational-history-response.type';

@RequireRole(Role.VIEWER)
@Controller('conflicts/relational')
export class RelationalConflictController {
  public constructor(
    private readonly _resolverService: RelationalConflictResolverService,
    private readonly _historyService: RelationalConflictHistoryService,
    private readonly _logger: LoggerService,
  ) {}

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() dto: ResolveRelationalConflictDto): Promise<RelationalConflictEntity> {
    this._logger.info(
      `RelationalConflictController.resolve — PATCH /api/conflicts/relational/resolve conflictIds=[${dto.conflictIds.join(', ')}] winner="${dto.winnerRelatedId}"`,
      'app-workflow',
    );
    return this._resolverService.resolve(dto);
  }

  @Get('history')
  public async history(
    @Query('anchorTable') anchorTable: string,
    @Query('anchorId') anchorId: string,
    @Query('relatedTable') relatedTable: string,
  ): Promise<RelationalHistoryResponse> {
    this._logger.info(
      `RelationalConflictController.history — GET /api/conflicts/relational/history "${anchorTable}/${anchorId}" relatedTable="${relatedTable}"`,
      'app-workflow',
    );
    return this._historyService.getHistory(anchorTable, anchorId, relatedTable);
  }
}
