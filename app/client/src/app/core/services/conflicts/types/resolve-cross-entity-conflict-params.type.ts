export type ResolveCrossEntityConflictParams = {
  conflictId: number;
  winnerValue: string;
  conflictResolver: string;
  resolutionNotes: string | null;
  applyToRobot: boolean;
};
