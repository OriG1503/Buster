export type RelationalConflictType = 'TWO_CHILDS' | 'TWO_FATHERS';

export type RelationalConflictOption = {
  id: string;
  source: string | null;
  childData: Record<string, string | null>;
};

export type RelationalConflictDetail = {
  conflictIds: number[];
  conflictType: RelationalConflictType;
  relatedTable: string;
  options: RelationalConflictOption[];
};

export type TwoFathersConflictDetail = {
  conflictIds: number[];
  relatedTable: string;
  options: RelationalConflictOption[];
};

export type ConflictValueEntry = {
  value: string | null;
  source: string | null;
  notes: string | null;
  sourceTime: string | null;
  createdAt: string;
};

export type ConflictColumnDetail = {
  columnName: string;
  currentValue: string | null;
  currentSource: string | null;
  currentNotes: string | null;
  currentSourceTime: string | null;
  currentDate: string;
  isConflicted: boolean;
  conflictValues: ConflictValueEntry[];
  relationalConflict?: RelationalConflictDetail;
};

export type ConflictEntityDetail = {
  columns: ConflictColumnDetail[];
  twoFathersConflict: TwoFathersConflictDetail | null;
};
