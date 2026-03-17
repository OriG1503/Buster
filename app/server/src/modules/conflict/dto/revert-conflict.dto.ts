export type RevertConflictDto = {
  tableName: string;
  entityId: string;
  columnName: string;
  revertValue: string;
  revertedBy: string;
  resolutionNotes: string;
};
