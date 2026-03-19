import { computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { ENTITY_COLUMN_TREE } from '../../shared/consts/entity-column-tree.consts';
import { FK_TO_ENTITY_ID } from '../../shared/consts/fk-to-entity-id.consts';
import { ColumnGroup } from '../../shared/types/column-group.type';
import { ColumnToggleEvent } from '../../shared/types/column-toggle-event.type';

type HomeState = {
  selectedTable: string;
  selectedColumns: string[];
  filters: Record<string, string>;
};

const VALID_TABLES = new Set(Object.keys(ENTITY_COLUMN_TREE));
const DEFAULT_TABLE = 'robots';

function defaultColumns(tableName: string): string[] {
  const keys = ENTITY_COLUMN_TREE[tableName][0].columns.map((col) => col.key);
  const linked = keys
    .map((key) => FK_TO_ENTITY_ID[key])
    .filter((id): id is string => !!id && !keys.includes(id));
  return [...keys, ...linked];
}

export const HomeStore = signalStore(
  { providedIn: 'root' },
  withState<HomeState>({
    selectedTable: DEFAULT_TABLE,
    selectedColumns: defaultColumns(DEFAULT_TABLE),
    filters: {},
  }),
  withComputed((store) => ({
    columnGroups: computed<ColumnGroup[]>(() => ENTITY_COLUMN_TREE[store.selectedTable()]),
  })),
  withMethods((store) => ({
    selectTable(tableName: string): void {
      patchState(store, {
        selectedTable: tableName,
        selectedColumns: defaultColumns(tableName),
        filters: {},
      });
    },

    toggleColumn({ key, checked }: ColumnToggleEvent): void {
      const cols = store.selectedColumns();
      const linkedId = FK_TO_ENTITY_ID[key];
      if (checked) {
        const toAdd = [key, ...(linkedId && !cols.includes(linkedId) ? [linkedId] : [])];
        patchState(store, { selectedColumns: [...cols, ...toAdd] });
      } else {
        const toRemove = new Set([key, ...(linkedId ? [linkedId] : [])]);
        patchState(store, { selectedColumns: cols.filter((col) => !toRemove.has(col)) });
      }
    },

    setFilter(col: string, value: string): void {
      patchState(store, (state) => ({ filters: { ...state.filters, [col]: value } }));
    },

    syncFromUrl(params: Params): void {
      const table = VALID_TABLES.has(params['table']) ? params['table'] : DEFAULT_TABLE;
      const cols = params['cols']
        ? params['cols'].split(',').filter((c: string) => c.length > 0)
        : defaultColumns(table);
      const filters: Record<string, string> = {};
      Object.keys(params)
        .filter((k) => k.startsWith('f_'))
        .forEach((k) => {
          if (params[k]) {
            filters[k.slice(2)] = params[k];
          }
        });
      patchState(store, { selectedTable: table, selectedColumns: cols, filters });
    },
  })),
  withHooks((store) => ({
    onInit(): void {
      const route = inject(ActivatedRoute);
      const router = inject(Router);

      const snapshot = route.snapshot.queryParams as Params;
      if (snapshot['table'] || snapshot['cols']) {
        store.syncFromUrl(snapshot);
      }

      effect(() => {
        const filterParams = Object.fromEntries(
          Object.entries(store.filters())
            .filter(([, v]) => v.length > 0)
            .map(([col, v]) => [`f_${col}`, v]),
        );
        router.navigate([], {
          queryParams: { table: store.selectedTable(), cols: store.selectedColumns().join(','), ...filterParams },
          replaceUrl: true,
        });
      });
    },
  })),
);
