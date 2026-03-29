import { ConflictGroup } from '../../../shared/types/conflict-group.type';

export type ConflictsState = {
  openCount: number;
  openConflicts: ConflictGroup[];
  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  filter: { tableName: string; entityId: string; conflictIds: number[] };
};
