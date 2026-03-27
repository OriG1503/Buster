import { Body, Controller, Post } from '@nestjs/common';

import { TableViewQueryDto } from './dto/table-view-query.dto';
import { TableViewService } from './table-view.service';
import { TableViewResponse } from './types/table-view-response.type';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { Role } from '../auth/types/role.type';

@RequireRole(Role.VIEWER)
@Controller('table-view')
export class TableViewController {
  public constructor(private readonly _tableViewService: TableViewService) {}

  @Post()
  public async query(@Body() dto: TableViewQueryDto): Promise<TableViewResponse> {
    return this._tableViewService.query(dto);
  }
}
