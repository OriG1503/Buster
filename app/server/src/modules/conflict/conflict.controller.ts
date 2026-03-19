import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { BaseEntity } from '../../shared/entities/base.entity';
import { ConflictHistoryService } from './conflict-history.service';
import { ConflictResolverService } from './conflict-resolver.service';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { RevertService } from './revert.service';
import { RevertConflictDto } from './dto/revert-conflict.dto';
import { ConflictHistoryResponse } from './types/conflict-history-response.type';

@Controller('conflicts')
export class ConflictController {
  public constructor(
    private readonly _conflictResolverService: ConflictResolverService,
    private readonly _revertService: RevertService,
    private readonly _conflictHistoryService: ConflictHistoryService,
  ) {}

  @Patch('resolve')
  public async resolve(@Body() resolveConflictDto: ResolveConflictDto): Promise<BaseEntity> {
    return this._conflictResolverService.resolve(resolveConflictDto);
  }

  @Patch('revert')
  public async revert(@Body() revertConflictDto: RevertConflictDto): Promise<BaseEntity> {
    return this._revertService.revert(revertConflictDto);
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
