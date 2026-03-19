import { Component, computed, signal } from '@angular/core';

import { ENTITY_COLUMN_TREE } from '../../../features/home/consts/entity-column-tree.consts';
import { FK_TO_ENTITY_ID } from '../../../features/home/consts/fk-to-entity-id.consts';
import { HomeTableComponent } from '../../../features/home/organisms/home-table/home-table.component';
import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';
import { ColumnToggleEvent } from '../../../features/home/types/column-toggle-event.type';

@Component({
  selector: 'app-home-layout',
  imports: [TableActionBarComponent, HomeTableComponent],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
})
export class HomeLayoutComponent {
  protected readonly _$resultCount = signal(0);
  protected readonly _$selectedTable = signal<string>('robots');
  protected readonly _$selectedColumns = signal<string[]>(this._defaultColumns('robots'));
  protected readonly _$columnGroups = computed(() => ENTITY_COLUMN_TREE[this._$selectedTable()]);

  public onEntitySelected(tableName: string): void {
    this._$selectedTable.set(tableName);
    this._$selectedColumns.set(this._defaultColumns(tableName));
  }

  public onColumnToggle({ key, checked }: ColumnToggleEvent): void {
    const cols = this._$selectedColumns();
    const linkedId = FK_TO_ENTITY_ID[key];

    if (checked) {
      const toAdd = [key, ...(linkedId && !cols.includes(linkedId) ? [linkedId] : [])];
      this._$selectedColumns.set([...cols, ...toAdd]);
    } else {
      const toRemove = new Set([key, ...(linkedId ? [linkedId] : [])]);
      this._$selectedColumns.set(cols.filter((col) => !toRemove.has(col)));
    }
  }

  public onExportExcel(): void {}

  private _defaultColumns(tableName: string): string[] {
    const keys = ENTITY_COLUMN_TREE[tableName][0].columns.map((col) => col.key);
    const linked = keys.map((key) => FK_TO_ENTITY_ID[key]).filter((id): id is string => !!id && !keys.includes(id));
    return [...keys, ...linked];
  }
}
