import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { ENTITY_COLUMN_TREE } from '../../../shared/consts/entity-column-tree.consts';
import { ColumnGroup } from '../../../shared/types/column-group.type';
import { DisplayNamesConfig } from './types/display-names-config.type';

@Injectable({ providedIn: 'root' })
export class DisplayNamesService {
  private readonly _http = inject(HttpClient);
  private readonly _$config = signal<DisplayNamesConfig | null>(null);

  public readonly $isLoaded = computed(() => this._$config() !== null);

  /** Fetches the display-names config from the server. Call once on app startup. */
  public load(): void {
    this._http.get<DisplayNamesConfig>('/api/display-names').subscribe((config) => {
      this._$config.set(config);
    });
  }

  public getEntityName(tableName: string): string {
    return this._$config()?.[tableName]?.displayName ?? tableName;
  }

  public getEntityPluralName(tableName: string): string {
    return this._$config()?.[tableName]?.pluralDisplayName ?? tableName;
  }

  public getColumnLabel(tableName: string, columnName: string): string {
    return this._$config()?.[tableName]?.columns[columnName]?.label ?? columnName;
  }

  /** Resolves a label for a dot-notation column key (e.g. "sensors.sensorType"). */
  public getColumnLabelByKey(columnKey: string): string {
    const [table, field] = columnKey.split('.');
    return this.getColumnLabel(table, field);
  }

  /** Reactive full column tree with labels populated from server config. */
  public readonly $columnTree = computed<Record<string, ColumnGroup[]>>(() => {
    const config = this._$config();
    return Object.fromEntries(
      Object.entries(ENTITY_COLUMN_TREE).map(([tableName, groups]) => [
        tableName,
        groups.map((group) => ({
          entityTable: group.entityTable,
          label: config?.[group.entityTable]?.pluralDisplayName ?? group.entityTable,
          columns: group.columns.map((key) => {
            const [table, field] = key.split('.');
            return { key, label: config?.[table]?.columns[field]?.label ?? field };
          }),
        })),
      ]),
    );
  });

  /** Reactive entity options list for dropdowns and selectors. */
  public readonly $entityOptions = computed(() =>
    Object.keys(ENTITY_COLUMN_TREE).map((tableName) => ({
      tableName,
      label: this._$config()?.[tableName]?.pluralDisplayName ?? tableName,
    })),
  );
}
