import { computed, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { combineLatest, debounceTime, filter, map, switchMap, take } from 'rxjs';

import { TableViewService } from '../services/table-view.service';
import { DisplayNamesService } from '../services/display-names/display-names.service';
import { ENTITY_COLUMN_TREE } from '../../shared/consts/entity-column-tree.consts';
import { FK_TO_ENTITY_ID } from '../../shared/consts/fk-to-entity-id.consts';
import { ColumnGroup } from '../../shared/types/column-group.type';
import { ColumnToggleEvent } from '../../shared/types/column-toggle-event.type';
import { TableRow } from '../../shared/types/table-view-response.type';
import { HOME_PAGE_SIZE, DEFAULT_TABLE, VALID_TABLES } from './home-store.consts';
import { HomeState } from './types/home-state.type';

function defaultColumns(tableName: string): string[] {
  const keys = ENTITY_COLUMN_TREE[tableName][0].columns;
  // Only follow FK → child.id direction to avoid adding parent FK columns unintentionally.
  const linked = keys
    .filter((key) => !key.endsWith('.id'))
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
    page: 1,
    rows: [],
    total: 0,
    isLoading: false,
    isLoadingMore: false,
    refreshTick: 0,
  }),
  withComputed((store) => {
    const displayNames = inject(DisplayNamesService);
    return {
      columnGroups: computed<ColumnGroup[]>(() => displayNames.$columnTree()[store.selectedTable()] ?? []),
      hasMore: computed(() => store.rows().length < store.total()),
    };
  }),
  withMethods((store) => ({
    selectTable(tableName: string): void {
      patchState(store, {
        selectedTable: tableName,
        selectedColumns: defaultColumns(tableName),
        filters: {},
        page: 1,
        rows: [],
        isLoadingMore: false,
      });
    },

    toggleColumn({ key, checked }: ColumnToggleEvent): void {
      const cols = store.selectedColumns();
      // Only follow FK → child.id direction to avoid adding parent FK columns unintentionally.
      const linkedId = key.endsWith('.id') ? null : FK_TO_ENTITY_ID[key];
      if (checked) {
        const toAdd = [key, ...(linkedId && !cols.includes(linkedId) ? [linkedId] : [])];
        patchState(store, { selectedColumns: [...cols, ...toAdd], page: 1, rows: [], isLoadingMore: false });
      } else {
        const toRemove = new Set([key, ...(linkedId ? [linkedId] : [])]);
        patchState(store, {
          selectedColumns: cols.filter((col) => !toRemove.has(col)),
          page: 1,
          rows: [],
          isLoadingMore: false,
        });
      }
    },

    setFilter(col: string, value: string): void {
      patchState(store, (state) => ({
        filters: { ...state.filters, [col]: value },
        page: 1,
        rows: [],
        isLoadingMore: false,
      }));
    },

    clearFilters(): void {
      patchState(store, { filters: {}, page: 1, rows: [], isLoadingMore: false });
    },

    reorderColumns(newOrder: string[]): void {
      patchState(store, { selectedColumns: newOrder, page: 1, rows: [], isLoadingMore: false });
    },

    loadMore(): void {
      if (store.isLoading() || store.isLoadingMore() || !store.hasMore()) {
        return;
      }
      patchState(store, (state) => ({ page: state.page + 1, isLoadingMore: true }));
    },

    refresh(): void {
      patchState(store, (state) => ({ refreshTick: state.refreshTick + 1, page: 1, rows: [], isLoadingMore: false }));
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
      const tableViewService = inject(TableViewService);

      // Wait for the router to finish the initial navigation before reading URL params.
      // Reading snapshot before NavigationEnd would give empty params since the store
      // (providedIn: 'root') may initialize before the router processes the URL.
      const isInitialized = signal(false);

      router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          take(1),
        )
        .subscribe(() => {
          const params = route.snapshot.queryParams as Params;
          if (params['table'] || params['cols']) {
            store.syncFromUrl(params);
          }
          isInitialized.set(true);
        });

      // Only write state to URL after the initial URL has been read, to avoid
      // the effect overwriting the pasted URL with default state on first run.
      // Also guard against running while on a different route (e.g. /conflicts).
      effect(() => {
        if (!isInitialized()) { return; }
        const urlPath = router.url.split('?')[0];
        if (urlPath !== '/') { return; }
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

      // Gate data fetching behind isInitialized so we don't fire a request with
      // default state before the URL params have been applied.
      combineLatest({
        isReady: toObservable(isInitialized),
        tableName: toObservable(store.selectedTable),
        columns: toObservable(store.selectedColumns),
        filters: toObservable(store.filters),
        page: toObservable(store.page),
        refreshTick: toObservable(store.refreshTick),
      })
        .pipe(
          filter(({ isReady }) => isReady),
          debounceTime(300),
          switchMap(({ tableName, columns, filters, page }) => {
            const isAppend = store.isLoadingMore();
            if (!isAppend) {
              patchState(store, { isLoading: true });
            }
            return tableViewService
              .query({ tableName, columns, filters, page, pageSize: HOME_PAGE_SIZE })
              .pipe(map((res) => ({ res, isAppend })));
          }),
        )
        .subscribe({
          next: ({ res, isAppend }) => {
            if (isAppend) {
              patchState(store, (state) => ({
                rows: [...state.rows, ...res.rows],
                total: res.total,
                isLoadingMore: false,
              }));
            } else {
              patchState(store, { rows: res.rows, total: res.total, isLoading: false });
            }
          },
          error: () => patchState(store, { isLoading: false, isLoadingMore: false }),
        });
    },
  })),
);
