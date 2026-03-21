import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RequireRole } from '../../auth/decorators/require-role.decorator';
import { Role } from '../../auth/types/role.type';
import { ConflictHistoryService } from './conflict-history.service';
import { ConflictResolverService } from './services/conflict-resolver.service';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { RevertService } from './services/revert.service';
import { RevertConflictDto } from './dto/revert-conflict.dto';
import { ConflictHistoryResponse } from './types/conflict-history-response.type';
import { ConflictListService } from './services/conflict-list.service';
import { ConflictListResponse } from './types/conflict-list-response.type';
import { ConflictEntityDetailService } from './services/conflict-entity-detail.service';
import { ConflictEntityDetailResponse } from './types/conflict-entity-detail-response.type';

@RequireRole(Role.VIEWER)
@Controller('conflicts')
export class ConflictController {
  public constructor(
    private readonly _conflictResolverService: ConflictResolverService,
    private readonly _revertService: RevertService,
    private readonly _conflictHistoryService: ConflictHistoryService,
    private readonly _conflictListService: ConflictListService,
    private readonly _conflictEntityDetailService: ConflictEntityDetailService,
  ) {}

  @Get()
  public async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('tableName') tableName?: string,
    @Query('entityId') entityId?: string,
    @Query('conflictIds') conflictIds?: string,
  ): Promise<ConflictListResponse> {
    const parsedConflictIds = conflictIds ? conflictIds.split(',').map(Number).filter((n) => !isNaN(n)) : undefined;
    return this._conflictListService.getOpenGroups(Number(page), Number(limit), tableName, entityId, parsedConflictIds);
  }

  @Get('count')
  public async count(): Promise<{ count: number }> {
    return { count: await this._conflictListService.countOpen() };
  }

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() resolveConflictDto: ResolveConflictDto): Promise<BaseEntity> {
    return this._conflictResolverService.resolve(resolveConflictDto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('revert')
  public async revert(@Body() revertConflictDto: RevertConflictDto): Promise<BaseEntity> {
    return this._revertService.revert(revertConflictDto);
  }

  @Get('entity')
  public async entityDetail(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
  ): Promise<ConflictEntityDetailResponse> {
    return this._conflictEntityDetailService.getEntityDetail(tableName, entityId);
  }

  @Get('history')
  public async history(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
    @Query('columnName') columnName: string,
  ): Promise<ConflictHistoryResponse> {
    return this._conflictHistoryService.getHistory(tableName, entityId, columnName);
  }
}
