import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ConflictHistoryPopupComponent } from '../../../conflict-history/organisms/conflict-history-popup/conflict-history-popup.component';
import { CellInfoPopupComponent } from '../cell-info-popup/cell-info-popup.component';
import { HomeStore } from '../../../../core/store/home.store';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { TableCell } from '../../../../shared/types/table-cell.type';
import { TableRow } from '../../../../shared/types/table-view-response.type';
import { HistoryTarget } from '../../../../shared/types/history-target.type';
import { CellInfoTarget } from '../../types/cell-info-target.type';

@Component({
  selector: 'app-home-table',
  imports: [ConflictHistoryPopupComponent, CellInfoPopupComponent],
  templateUrl: './home-table.component.html',
  styleUrl: './home-table.component.scss',
})
export class HomeTableComponent {
  protected readonly _store = inject(HomeStore);
  private readonly _router = inject(Router);
  protected readonly _$historyTarget = signal<HistoryTarget | null>(null);
  protected readonly _$cellInfoTarget = signal<CellInfoTarget | null>(null);

  protected readonly _$displayColumns = computed(() => {
    const cols = this._store.selectedColumns();
    return cols.filter((col) => {
      if (!col.endsWith('.id')) {
        return true;
      }
      const fkKey = FK_TO_ENTITY_ID[col];
      return !(fkKey && cols.includes(fkKey));
    });
  });

  protected readonly _columnLabelMap = ENTITY_COLUMN_LABEL_MAP;

  public onFilterChange(col: string, value: string): void {
    this._store.setFilter(col, value);
  }

  public onCellClick(row: TableRow, col: string, event: MouseEvent): void {
    const cell = row[col];
    if (!cell) {
      return;
    }
    if (cell.status === 'open' && cell.conflictId !== null) {
      this._router.navigate(['/conflicts'], { queryParams: { id: cell.conflictId } });
      return;
    }
    if (cell.status === 'resolved') {
      const [tableName, columnName] = col.split('.');
      const entityId = row[`${tableName}.id`]?.value ?? '';
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this._$historyTarget.set({
        tableName,
        entityId,
        columnName,
        anchorBottom: rect.bottom,
        anchorCenterX: rect.left + rect.width / 2,
      });
      return;
    }

    if (cell.status === 'raw' && cell.value) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this._$cellInfoTarget.set({
        anchorBottom: rect.bottom,
        anchorCenterX: rect.left + rect.width / 2,
        source: cell.source,
        notes: cell.notes,
        uploadedAt: cell.uploadedAt,
      });
    }
  }

  public onHistoryPopupClose(): void {
    this._$historyTarget.set(null);
  }

  public onCellInfoPopupClose(): void {
    this._$cellInfoTarget.set(null);
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public cellValue(cell: TableCell | undefined): string {
    return cell?.value ?? '';
  }

  public cellStatus(cell: TableCell | undefined): string {
    return cell?.status ?? 'raw';
  }
}
