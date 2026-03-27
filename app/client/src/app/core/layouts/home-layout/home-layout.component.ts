import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { HomeTableComponent } from '../../../features/home/organisms/home-table/home-table.component';
import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';
import { DisplayNamesService } from '../../services/display-names/display-names.service';
import { FK_TO_ENTITY_ID } from '../../../shared/consts/fk-to-entity-id.consts';
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
  private readonly _displayNames = inject(DisplayNamesService);

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

  protected readonly _$isExportMode = signal(false);
  protected readonly _$selectedExportIndices = signal<Set<number>>(new Set());
  protected readonly _$selectedExportCount = computed(() => this._$selectedExportIndices().size);

  public onEntitySelected(tableName: string): void {
    this._store.selectTable(tableName);
  }

  public onColumnToggle(event: ColumnToggleEvent): void {
    this._store.toggleColumn(event);
  }

  public onColumnReorder(newOrder: string[]): void {
    this._store.reorderColumns(newOrder);
  }

  public onClearFilters(): void {
    this._store.clearFilters();
  }

  public onUploadClick(): void {
    this._uploadDialogService.open();
  }

  public onExportExcel(): void {
    this._$selectedExportIndices.set(new Set());
    this._$isExportMode.set(true);
  }

  public onExportConfirm(): void {
    const selectedIndices = this._$selectedExportIndices();
    const cols = this._store.selectedColumns();
    const displayCols = cols.filter((col) => {
      if (!col.endsWith('.id')) { return true; }
      const fkKey = FK_TO_ENTITY_ID[col];
      return !(fkKey && cols.includes(fkKey));
    });

    const rows = this._store.rows().filter((_, i) => selectedIndices.has(i));
    const headers = displayCols.map((col) => this._displayNames.getColumnLabelByKey(col));
    const dataRows = rows.map((row) => displayCols.map((col) => row[col]?.value ?? ''));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this._store.selectedTable());
    XLSX.writeFile(wb, `${this._store.selectedTable()}.xlsx`);

    this._$isExportMode.set(false);
    this._$selectedExportIndices.set(new Set());
  }

  public onExportCancel(): void {
    this._$isExportMode.set(false);
    this._$selectedExportIndices.set(new Set());
  }

  public onRowExportToggled(index: number): void {
    this._$selectedExportIndices.update((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }
}
