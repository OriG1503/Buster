import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
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
  ) {}

  @RequireRole(Role.EDITOR)
  @Patch('resolve')
  public async resolve(@Body() dto: ResolveRelationalConflictDto): Promise<RelationalConflictEntity> {
    return this._resolverService.resolve(dto);
  }

  @Get('history')
  public async history(
    @Query('anchorTable') anchorTable: string,
    @Query('anchorId') anchorId: string,
    @Query('relatedTable') relatedTable: string,
  ): Promise<RelationalHistoryResponse> {
    return this._historyService.getHistory(anchorTable, anchorId, relatedTable);
  }
}
