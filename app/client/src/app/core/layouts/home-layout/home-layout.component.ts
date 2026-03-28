import { Component, computed, inject, signal } from '@angular/core';

import { HomeTableComponent } from '../../../features/home/organisms/home-table/home-table.component';
import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';
import { HomeStore } from '../../store/home.store';
import { UploadDialogService } from '../../services/upload-dialog/upload-dialog.service';
import { ExportService } from '../../services/export/export.service';
import { ColumnToggleEvent } from '../../../shared/types/column-toggle-event.type';

@Component({
  selector: 'app-home-layout',
  imports: [TableActionBarComponent, HomeTableComponent],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
})
export class HomeLayoutComponent {
  protected readonly _store = inject(HomeStore);
  private readonly _uploadDialogService = inject(UploadDialogService);
  private readonly _exportService = inject(ExportService);

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
    this._exportService.exportToExcel(
      this._store.rows(),
      this._$selectedExportIndices(),
      this._store.selectedColumns(),
      this._store.selectedTable(),
    );
    this._resetExportMode();
  }

  public onExportCancel(): void {
    this._resetExportMode();
  }

  public onRowExportToggled(index: number): void {
    this._$selectedExportIndices.update((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  private _resetExportMode(): void {
    this._$isExportMode.set(false);
    this._$selectedExportIndices.set(new Set());
  }
}
