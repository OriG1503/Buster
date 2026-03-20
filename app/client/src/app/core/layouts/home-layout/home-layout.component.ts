import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { HomeTableComponent } from '../../../features/home/organisms/home-table/home-table.component';
import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';
import { ColumnToggleEvent } from '../../../shared/types/column-toggle-event.type';
import { HomeStore } from '../../store/home.store';
import { UploadDialogService } from '../../services/upload-dialog/upload-dialog.service';

@Component({
  selector: 'app-home-layout',
  imports: [TableActionBarComponent, HomeTableComponent],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
})
export class HomeLayoutComponent {
  protected readonly _store = inject(HomeStore);
  private readonly _uploadDialogService = inject(UploadDialogService);
  private readonly _router = inject(Router);

  public constructor() {
    effect(() => {
      const filterParams = Object.fromEntries(
        Object.entries(this._store.filters())
          .filter(([, v]) => v.length > 0)
          .map(([col, v]) => [`f_${col}`, v]),
      );
      this._router.navigate([], {
        queryParams: { table: this._store.selectedTable(), cols: this._store.selectedColumns().join(','), ...filterParams },
        replaceUrl: true,
      });
    });
  }

  protected readonly _$hasActiveFilters = computed(() => Object.values(this._store.filters()).some((v) => v.length > 0));

  public onEntitySelected(tableName: string): void {
    this._store.selectTable(tableName);
  }

  public onColumnToggle(event: ColumnToggleEvent): void {
    this._store.toggleColumn(event);
  }

  public onClearFilters(): void {
    this._store.clearFilters();
  }

  public onUploadClick(): void {
    this._uploadDialogService.open();
  }

  public onExportExcel(): void {}
}
