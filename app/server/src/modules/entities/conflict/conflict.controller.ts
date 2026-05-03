import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { RequireRole } from '../../auth/decorators/require-role.decorator';
import { Role } from '../../auth/types/role.type';
import { ConflictListService } from './services/conflict-list.service';
import { ConflictEntityDetailService } from './services/conflict-entity-detail.service';
import { ConflictListResponse } from './types/conflict-list-response.type';
import { ConflictEntityDetailResponse } from './types/conflict-entity-detail-response.type';
import { CheckOpenIdsDto } from './dto/check-open-ids.dto';

@RequireRole(Role.VIEWER)
@Controller('conflicts')
export class ConflictController {
  public constructor(
    private readonly _conflictListService: ConflictListService,
    private readonly _conflictEntityDetailService: ConflictEntityDetailService,
    private readonly _logger: LoggerService,
  ) {}

  @Get()
  public async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('tableName') tableName?: string,
    @Query('entityId') entityId?: string,
    @Query('conflictIds') conflictIds?: string,
  ): Promise<ConflictListResponse> {
    //LOG
    this._logger.info(
      `ConflictController.list — GET /api/conflicts page=${page} limit=${limit} tableName="${tableName ?? 'any'}" entityId="${entityId ?? 'any'}" conflictIds="${conflictIds ?? ''}"`,
      'app-workflow',
    );
    const parsedConflictIds = conflictIds
      ? conflictIds
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : undefined;
    return this._conflictListService.getOpenGroups(Number(page), Number(limit), tableName, entityId, parsedConflictIds);
  }

  @Get('count')
  public async count(): Promise<{ count: number }> {
    //LOG
    this._logger.info('ConflictController.count — GET /api/conflicts/count', 'app-workflow');
    return { count: await this._conflictListService.countOpen() };
  }

  @Post('open-ids')
  public async checkOpenIds(@Body() dto: CheckOpenIdsDto): Promise<string[]> {
    //LOG
    this._logger.info(
      `ConflictController.checkOpenIds — POST /api/conflicts/open-ids ids=${dto.ids.length}`,
      'app-workflow',
    );
    return this._conflictListService.findOpenByEntityIds(dto.ids);
  }

  @Get('entity')
  public async entityDetail(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
  ): Promise<ConflictEntityDetailResponse> {
    //LOG
    this._logger.info(
      `ConflictController.entityDetail — GET /api/conflicts/entity tableName="${tableName}" entityId="${entityId}"`,
      'app-workflow',
    );
    return this._conflictEntityDetailService.getEntityDetail(tableName, entityId);
  }
}
