import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { ENTITY_COLUMN_TREE } from '../../../shared/consts/entity-column-tree.consts';
import { EntityFormatOption } from '../../../features/upload-dialog/consts/entity-format-options.consts';
import { ColumnGroup } from '../../../shared/types/column-group.type';
import { DisplayNamesConfig } from './types/display-names-config.type';

const FORMAT_OPTION_ASSET_PATHS: Record<string, { assetPath: string; filename: string }> = {
  robots: { assetPath: 'assets/templates/robot_template.xlsx', filename: 'robot_template.xlsx' },
  batteries: { assetPath: 'assets/templates/battery_template.xlsx', filename: 'battery_template.xlsx' },
  cardboards: { assetPath: 'assets/templates/cardboard_template.xlsx', filename: 'cardboard_template.xlsx' },
  sensors: { assetPath: 'assets/templates/sensor_template.xlsx', filename: 'sensor_template.xlsx' },
  wirings: { assetPath: 'assets/templates/wiring_template.xlsx', filename: 'wiring_template.xlsx' },
  communications: { assetPath: 'assets/templates/communication_template.xlsx', filename: 'communication_template.xlsx' },
  storages: { assetPath: 'assets/templates/storage_template.xlsx', filename: 'storage_template.xlsx' },
  plastics: { assetPath: 'assets/templates/plastic_template.xlsx', filename: 'plastic_template.xlsx' },
  irons: { assetPath: 'assets/templates/iron_template.xlsx', filename: 'iron_template.xlsx' },
};

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
            return {
              key,
              label: config?.[table]?.columns[field]?.label ?? field,
            };
          }),
        })),
      ]),
    );
  });

  /** Reactive entity options list for dropdowns and selectors. */
  public readonly $entityOptions = computed(() => {
    const config = this._$config();
    return Object.keys(ENTITY_COLUMN_TREE).map((tableName) => ({
      tableName,
      label: config?.[tableName]?.pluralDisplayName ?? tableName,
    }));
  });

  /** Reactive format options for the upload dialog template downloads. */
  public readonly $formatOptions = computed<EntityFormatOption[]>(() => {
    const config = this._$config();
    return Object.entries(FORMAT_OPTION_ASSET_PATHS).map(([tableName, paths]) => ({
      ...paths,
      label: `פורמט ${config?.[tableName]?.pluralDisplayName ?? tableName}`,
    }));
  });
}
