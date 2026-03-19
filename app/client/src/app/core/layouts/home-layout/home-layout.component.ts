import { Component, inject } from '@angular/core';

import { HomeTableComponent } from '../../../features/home/organisms/home-table/home-table.component';
import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';
import { ColumnToggleEvent } from '../../../shared/types/column-toggle-event.type';
import { HomeStore } from '../../store/home.store';

@Component({
  selector: 'app-home-layout',
  imports: [TableActionBarComponent, HomeTableComponent],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
})
export class HomeLayoutComponent {
  protected readonly _store = inject(HomeStore);

  public onEntitySelected(tableName: string): void {
    this._store.selectTable(tableName);
  }

  public onColumnToggle(event: ColumnToggleEvent): void {
    this._store.toggleColumn(event);
  }

  public onExportExcel(): void {}
}
