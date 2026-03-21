export type RelationalConflictType = 'TWO_CHILDS' | 'TWO_FATHERS';

export type RelationalConflictSnapshot = {
  anchor: Record<string, unknown>;
  oldRelated: Record<string, unknown>;
  newRelated: Record<string, unknown>;
};

export type RelationalConflictDetail = {
  conflictId: number;
  conflictType: RelationalConflictType;
  oldRelatedId: string;
  newRelatedId: string;
  relatedTable: string;
  oldRelatedSource: string | null;
  newRelatedSource: string | null;
  snapshot: RelationalConflictSnapshot | null;
};

export type ConflictValueEntry = {
  value: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
};

export type ConflictColumnDetail = {
  columnName: string;
  currentValue: string | null;
  currentSource: string | null;
  currentNotes: string | null;
  currentDate: string;
  isConflicted: boolean;
  conflictValues: ConflictValueEntry[];
  relationalConflict?: RelationalConflictDetail;
};

export type ConflictEntityDetail = ConflictColumnDetail[];
