export type RelationalConflictRow = {
  anchorTable: string;
  anchorId: string;
  relatedTable: string;
  conflictType: string;
  oldRelatedId: string;
  newRelatedId: string;
  isSolved: boolean | null;
  id: number;
};
