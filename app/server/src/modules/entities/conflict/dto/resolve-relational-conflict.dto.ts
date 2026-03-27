export type ResolveRelationalConflictDto = {
  /** The IDs of all relational_conflict rows in this FK-field group. */
  conflictIds: number[];

  /** Which competing related entity wins. */
  winnerRelatedId: string;

  /**
   * For TWO_CHILDS only: the ID of the child the winner should point to.
   * Allows cross-combination picks (e.g. winner=comm1 but with plastic2).
   * When omitted, the winner keeps its current child.
   */
  winnerChildId?: string | null;

  /** FK field on the winner entity that should be updated to winnerChildId (e.g. 'plasticId'). */
  winnerChildFkField?: string | null;

  conflictResolver: string;
  resolutionNotes?: string | null;
};
