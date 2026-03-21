type ConflictValueEntry = {
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
};

export type ConflictEntityDetailResponse = ConflictColumnDetail[];
