export type ResolveConflictDto = {
  tableName: string;
  entityId: string;
  columnName: string;
  winnerValue: string;
  conflictResolver: string;
  resolutionNotes: string;
};
