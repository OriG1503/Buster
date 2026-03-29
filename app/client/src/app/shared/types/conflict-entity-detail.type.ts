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

export type CrossEntityConflictEntry = {
  conflictId: number;
  /** ID of the other entity (wiring when viewing robot, robot when viewing wiring). */
  entityId: string;
  /** Table name of the other entity ('wirings' or 'robots'). */
  entityTable: string;
  value: string | null;
  source: string | null;
  notes: string | null;
  sourceTime: string | null;
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
  crossEntityConflicts: CrossEntityConflictEntry[];
  relationalConflict?: RelationalConflictDetail;
};

export type ConflictEntityDetail = {
  columns: ConflictColumnDetail[];
  twoFathersConflict: TwoFathersConflictDetail | null;
};
