import { Module } from '@nestjs/common';

import { TableViewController } from './table-view.controller';
import { TableViewService } from './table-view.service';

@Module({
  controllers: [TableViewController],
  providers: [TableViewService],
})
export class TableViewModule {}
