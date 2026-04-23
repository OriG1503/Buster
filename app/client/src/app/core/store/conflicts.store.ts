import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

import { ConflictsService } from '../services/conflicts/conflicts.service';
import { ConflictsState } from './types/conflicts-state.type';
import { CONFLICTS_PAGE_SIZE, CONFLICTS_INITIAL_STATE } from './consts/conflicts-store.consts';

export const ConflictsStore = signalStore(
  { providedIn: 'root' },
  withState<ConflictsState>(CONFLICTS_INITIAL_STATE),
  withMethods((store, conflictsService = inject(ConflictsService)) => ({
    loadCount(): void {
      conflictsService.getCount().subscribe({
        next: ({ count }) => patchState(store, { openCount: count }),
      });
    },
    loadConflicts(tableName = '', entityId = '', conflictIds: number[] = [], date = ''): void {
      patchState(store, {
        isLoadingMore: true,
        page: 0,
        hasMore: true,
        openConflicts: [],
        filter: { tableName, entityId, conflictIds, date },
      });
      conflictsService.getList(1, CONFLICTS_PAGE_SIZE, tableName, entityId, conflictIds, date).subscribe({
        next: (openConflicts) =>
          patchState(store, {
            openConflicts,
            page: 1,
            hasMore: openConflicts.length === CONFLICTS_PAGE_SIZE,
            isLoadingMore: false,
          }),
      });
    },
    loadMoreConflicts(): void {
      if (store.isLoadingMore() || !store.hasMore()) {
        return;
      }
      const nextPage = store.page() + 1;
      const { tableName, entityId, conflictIds, date } = store.filter();
      patchState(store, { isLoadingMore: true });
      conflictsService.getList(nextPage, CONFLICTS_PAGE_SIZE, tableName, entityId, conflictIds, date).subscribe({
        next: (newConflicts) =>
          patchState(store, (state) => ({
            openConflicts: [...state.openConflicts, ...newConflicts],
            page: nextPage,
            hasMore: newConflicts.length === CONFLICTS_PAGE_SIZE,
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
