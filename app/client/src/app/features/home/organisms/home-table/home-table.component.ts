import { Component, computed, input, signal } from '@angular/core';

import { FK_TO_ENTITY_ID } from '../../consts/fk-to-entity-id.consts';
import { COLUMN_LABEL_MAP } from '../../mapping/home.label-map';

@Component({
  selector: 'app-home-table',
  templateUrl: './home-table.component.html',
  styleUrl: './home-table.component.scss',
})
export class HomeTableComponent {
  public readonly $selectedColumns = input<string[]>([]);

  protected readonly _$filters = signal<Record<string, string>>({});

  protected readonly _$displayColumns = computed(() => {
    const cols = this.$selectedColumns();
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
    this._$filters.update((filters) => ({ ...filters, [col]: value }));
  }
}
