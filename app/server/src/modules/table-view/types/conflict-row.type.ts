export type ConflictRow = {
  tableName: string;
  entityId: string;
  columnName: string;
  isSolved: boolean | null;
  id: number;
};
