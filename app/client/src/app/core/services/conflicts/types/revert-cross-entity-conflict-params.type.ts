export type RevertCrossEntityConflictParams = {
  tableName: string;
  entityId: string;
  columnName: string;
  revertValue: string;
  revertedBy: string;
  resolutionNotes: string;
};
