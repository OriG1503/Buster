export type RevertConflictParams = {
  tableName: string;
  entityId: string;
  columnName: string;
  revertValue: string;
  revertedBy: string;
  resolutionNotes: string;
};
