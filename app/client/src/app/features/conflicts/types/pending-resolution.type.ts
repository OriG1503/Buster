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

export type PendingCrossEntityResolution = {
  type: 'crossEntity';
  columnName: string;
  conflictId: number;
  winnerValue: string;
  /** When true, applies winner to both entities (resolving from robot's card). */
  applyToRobot: boolean;
};

export type PendingResolution = PendingValueResolution | PendingRelationalResolution | PendingCrossEntityResolution;
