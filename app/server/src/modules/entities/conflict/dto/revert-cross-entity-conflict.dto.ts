export type RevertCrossEntityConflictDto = {
  tableName: string;
  entityId: string;
  columnName: string;
  revertValue: string;
  revertedBy: string;
  resolutionNotes: string;
};
