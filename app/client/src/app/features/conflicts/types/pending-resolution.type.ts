export type PendingValueResolution = {
  type: 'value';
  columnName: string;
  winnerValue: string;
};

export type PendingRelationalResolution = {
  type: 'twoFathers' | 'twoChilds';
  columnName: string;
  conflictIds: number[];
  winnerRelatedId: string;
  subtreeLevels: Map<string, string>;
};

export type PendingResolution = PendingValueResolution | PendingRelationalResolution;
