import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RequireRole } from '../../auth/decorators/require-role.decorator';
import { Role } from '../../auth/types/role.type';
import { ValueConflictHistoryService } from './value-conflict-history.service';
import { ValueConflictResolverService } from './services/value-conflict-resolver.service';
import { RelationalConflictResolverService } from './services/relational-conflict-resolver.service';
import { CrossEntityConflictResolverService } from './services/cross-entity-conflict-resolver.service';
import { ResolveValueConflictDto } from './dto/resolve-value-conflict.dto';
import { ResolveRelationalConflictDto } from './dto/resolve-relational-conflict.dto';
import { ResolveCrossEntityConflictDto } from './dto/resolve-cross-entity-conflict.dto';
import { RevertService } from './services/revert.service';
import { RevertValueConflictDto } from './dto/revert-value-conflict.dto';
import { ConflictHistoryResponse } from './types/conflict-history-response.type';
import { ConflictListService } from './services/conflict-list.service';
import { ConflictListResponse } from './types/conflict-list-response.type';
import { ConflictEntityDetailService } from './services/conflict-entity-detail.service';
import { ConflictEntityDetailResponse } from './types/conflict-entity-detail-response.type';
import { CheckOpenIdsDto } from './dto/check-open-ids.dto';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';
import { RelationalConflictHistoryService } from './relational-conflict-history.service';
import { RelationalHistoryResponse } from './types/relational-history-response.type';

@RequireRole(Role.VIEWER)
@Controller('conflicts')
export class ConflictController {
  public constructor(
    private readonly _valueConflictResolverService: ValueConflictResolverService,
    private readonly _relationalConflictResolverService: RelationalConflictResolverService,
    private readonly _crossEntityConflictResolverService: CrossEntityConflictResolverService,
    private readonly _revertService: RevertService,
    private readonly _valueConflictHistoryService: ValueConflictHistoryService,
    private readonly _conflictListService: ConflictListService,
    private readonly _conflictEntityDetailService: ConflictEntityDetailService,
    private readonly _relationalConflictHistoryService: RelationalConflictHistoryService,
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

  @Post('open-ids')
  public async checkOpenIds(@Body() dto: CheckOpenIdsDto): Promise<string[]> {
    return this._conflictListService.findOpenByEntityIds(dto.ids);
  }

  @RequireRole(Role.EDITOR)
  @Patch('value/resolve')
  public async resolveValue(@Body() resolveConflictDto: ResolveValueConflictDto): Promise<BaseEntity> {
    return this._valueConflictResolverService.resolve(resolveConflictDto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('relational/resolve')
  public async resolveRelational(@Body() dto: ResolveRelationalConflictDto): Promise<RelationalConflictEntity> {
    return this._relationalConflictResolverService.resolve(dto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('cross-entity/resolve')
  public async resolveCrossEntity(@Body() dto: ResolveCrossEntityConflictDto): Promise<void> {
    return this._crossEntityConflictResolverService.resolve(dto);
  }

  @RequireRole(Role.EDITOR)
  @Patch('revert')
  public async revert(@Body() revertConflictDto: RevertValueConflictDto): Promise<BaseEntity> {
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
    return this._valueConflictHistoryService.getHistory(tableName, entityId, columnName);
  }

  @Get('relational-history')
  public async relationalHistory(
    @Query('anchorTable') anchorTable: string,
    @Query('anchorId') anchorId: string,
    @Query('relatedTable') relatedTable: string,
  ): Promise<RelationalHistoryResponse> {
    return this._relationalConflictHistoryService.getHistory(anchorTable, anchorId, relatedTable);
  }
}
