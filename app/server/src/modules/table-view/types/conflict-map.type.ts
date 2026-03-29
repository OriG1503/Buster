export type ConflictEntry = {
  status: 'open' | 'resolved';
  conflictId: number | null;
  anchorTable: string | null;
  anchorId: string | null;
  relatedTable: string | null;
  isCrossEntity?: boolean;
};

/** conflictMap[tableName][entityId][columnName] */
export type ConflictMap = Record<string, Record<string, Record<string, ConflictEntry>>>;

/**
 * nullConflictMap[rootTable][rootEntityId][colKey]
 * Used when a joined entity's ID is null — the cell is colored based on the root row's entity.
 */
export type NullConflictMap = Record<string, Record<string, Record<string, ConflictEntry>>>;
