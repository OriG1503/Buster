import { ConflictsState } from './types/conflicts-state.type';

export const CONFLICTS_PAGE_SIZE = 20;

export const CONFLICTS_INITIAL_STATE: ConflictsState = {
  openCount: 0,
  openConflicts: [],
  page: 0,
  hasMore: true,
  isLoadingMore: false,
  filter: { tableName: '', entityId: '', conflictIds: [] },
};
