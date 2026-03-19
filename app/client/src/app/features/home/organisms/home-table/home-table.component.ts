import { Component, computed, inject } from '@angular/core';

import { HomeStore } from '../../../../core/store/home.store';
import { FK_TO_ENTITY_ID } from '../../consts/fk-to-entity-id.consts';
import { COLUMN_LABEL_MAP } from '../../mapping/home.label-map';

@Component({
  selector: 'app-home-table',
  templateUrl: './home-table.component.html',
  styleUrl: './home-table.component.scss',
})
export class HomeTableComponent {
  protected readonly _store = inject(HomeStore);

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

  protected readonly _columnLabelMap = COLUMN_LABEL_MAP;

  public onFilterChange(col: string, value: string): void {
    this._store.setFilter(col, value);
  }
}
