export type ResolveRelationalConflictParams = {
  conflictIds: number[];
  winnerRelatedId: string;
  winnerChildId?: string | null;
  winnerChildFkField?: string | null;
  conflictResolver: string;
  resolutionNotes?: string | null;
};
