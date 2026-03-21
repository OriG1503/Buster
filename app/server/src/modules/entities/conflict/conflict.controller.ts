import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { ValueConflictHistoryService } from './conflict-history.service';
import { ValueConflictResolverService } from './services/conflict-resolver.service';
import { RelationalConflictResolverService } from './services/relational-conflict-resolver.service';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { ResolveRelationalConflictDto } from './dto/resolve-relational-conflict.dto';
import { RevertService } from './services/revert.service';
import { RevertConflictDto } from './dto/revert-conflict.dto';
import { ConflictHistoryResponse } from './types/conflict-history-response.type';
import { ValueConflictListService } from './services/conflict-list.service';
import { ConflictListResponse } from './types/conflict-list-response.type';
import { ValueConflictEntityDetailService } from './services/conflict-entity-detail.service';
import { ConflictEntityDetailResponse } from './types/conflict-entity-detail-response.type';
import { RelationalConflictEntity } from './entities/relational-conflict.entity';

@Controller('conflicts')
export class ConflictController {
  public constructor(
    private readonly _valueConflictResolverService: ValueConflictResolverService,
    private readonly _relationalConflictResolverService: RelationalConflictResolverService,
    private readonly _revertService: RevertService,
    private readonly _valueConflictHistoryService: ValueConflictHistoryService,
    private readonly _valueConflictListService: ValueConflictListService,
    private readonly _valueConflictEntityDetailService: ValueConflictEntityDetailService,
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
    return this._valueConflictListService.getOpenGroups(Number(page), Number(limit), tableName, entityId, parsedConflictIds);
  }

  @Get('count')
  public async count(): Promise<{ count: number }> {
    return { count: await this._valueConflictListService.countOpen() };
  }

  @Patch('value/resolve')
  public async resolveValue(@Body() resolveConflictDto: ResolveConflictDto): Promise<BaseEntity> {
    return this._valueConflictResolverService.resolve(resolveConflictDto);
  }

  @Patch('relational/resolve')
  public async resolveRelational(@Body() dto: ResolveRelationalConflictDto): Promise<RelationalConflictEntity> {
    return this._relationalConflictResolverService.resolve(dto);
  }

  @Patch('revert')
  public async revert(@Body() revertConflictDto: RevertConflictDto): Promise<BaseEntity> {
    return this._revertService.revert(revertConflictDto);
  }

  @Get('entity')
  public async entityDetail(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
  ): Promise<ConflictEntityDetailResponse> {
    return this._valueConflictEntityDetailService.getEntityDetail(tableName, entityId);
  }

  @Get('history')
  public async history(
    @Query('tableName') tableName: string,
    @Query('entityId') entityId: string,
    @Query('columnName') columnName: string,
  ): Promise<ConflictHistoryResponse> {
    return this._valueConflictHistoryService.getHistory(tableName, entityId, columnName);
  }
}
