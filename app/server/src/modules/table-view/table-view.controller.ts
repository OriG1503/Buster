import { Body, Controller, Post } from '@nestjs/common';

import { LoggerService } from '../../shared/services/logger/logger.service';
import { TableViewQueryDto } from './dto/table-view-query.dto';
import { TableViewService } from './table-view.service';
import { TableViewResponse } from './types/table-view-response.type';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { Role } from '../auth/types/role.type';

@RequireRole(Role.VIEWER)
@Controller('table-view')
export class TableViewController {
  public constructor(
    private readonly _tableViewService: TableViewService,
    private readonly _logger: LoggerService,
  ) {}

  @Post()
  public async query(@Body() dto: TableViewQueryDto): Promise<TableViewResponse> {
    this._logger.info(
      `TableViewController.query — POST /api/table-view body { tableName: "${dto.tableName}", columns: ${dto.columns.length}, page: ${dto.page} }`,
      'app-workflow',
    );
    return this._tableViewService.query(dto);
  }
}
