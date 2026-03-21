import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

import { ConflictsService } from '../services/conflicts/conflicts.service';
import { ConflictsState } from '../../shared/types/conflicts-state.type';

const PAGE_SIZE = 20;

const INITIAL_STATE: ConflictsState = {
  openCount: 0,
  openConflicts: [],
  page: 0,
  hasMore: true,
  isLoadingMore: false,
  filter: { tableName: '', entityId: '', conflictIds: [] },
};

export const ConflictsStore = signalStore(
  { providedIn: 'root' },
  withState(INITIAL_STATE),
  withMethods((store, conflictsService = inject(ConflictsService)) => ({
    loadCount(): void {
      conflictsService.getCount().subscribe({
        next: ({ count }) => patchState(store, { openCount: count }),
      });
    },
    loadConflicts(tableName = '', entityId = '', conflictIds: number[] = []): void {
      patchState(store, { isLoadingMore: true, page: 0, hasMore: true, openConflicts: [], filter: { tableName, entityId, conflictIds } });
      conflictsService.getList(1, PAGE_SIZE, tableName, entityId, conflictIds).subscribe({
        next: (openConflicts) =>
          patchState(store, {
            openConflicts,
            page: 1,
            hasMore: openConflicts.length === PAGE_SIZE,
            isLoadingMore: false,
          }),
      });
    },
    loadMoreConflicts(): void {
      if (store.isLoadingMore() || !store.hasMore()) {
        return;
      }
      const nextPage = store.page() + 1;
      const { tableName, entityId, conflictIds } = store.filter();
      patchState(store, { isLoadingMore: true });
      conflictsService.getList(nextPage, PAGE_SIZE, tableName, entityId, conflictIds).subscribe({
        next: (newConflicts) =>
          patchState(store, (state) => ({
            openConflicts: [...state.openConflicts, ...newConflicts],
            page: nextPage,
            hasMore: newConflicts.length === PAGE_SIZE,
            isLoadingMore: false,
          })),
      });
    },
    removeConflict(tableName: string, entityId: string): void {
      patchState(store, (state) => ({
        openConflicts: state.openConflicts.filter(
          (c) => !(c.tableName === tableName && c.entityId === entityId),
        ),
        openCount: state.openCount - 1,
      }));
    },
  })),
  withHooks((store) => ({
    onInit(): void {
      store.loadCount();
    },
  })),
);
