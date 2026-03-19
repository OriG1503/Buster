import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { HomeStore } from '../../../../core/store/home.store';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { TableCell } from '../../../../shared/types/table-cell.type';
import { TableRow } from '../../../../shared/types/table-view-response.type';

@Component({
  selector: 'app-home-table',
  templateUrl: './home-table.component.html',
  styleUrl: './home-table.component.scss',
})
export class HomeTableComponent {
  protected readonly _store = inject(HomeStore);
  private readonly _router = inject(Router);

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

  public onCellClick(row: TableRow, col: string): void {
    const cell = row[col];
    if (!cell) {
      return;
    }
    if (cell.status === 'open' && cell.conflictId !== null) {
      this._router.navigate(['/conflicts'], { queryParams: { id: cell.conflictId } });
    }
    // 'raw' and 'resolved' popups will be implemented as separate components
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
