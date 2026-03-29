export type ResolveCrossEntityConflictDto = {
  /** ID of the cross-entity conflict row to resolve. */
  conflictId: number;
  /** The value chosen as the winner. */
  winnerValue: string;
  /** Username of the resolver. */
  conflictResolver: string;
  /** Optional notes explaining the choice. */
  resolutionNotes: string | null;
  /**
   * When true, the winner is applied to BOTH entities (robot and wiring).
   * When false, the winner is applied to the wiring only.
   * Set to true when resolving from a robot's conflict card.
   */
  applyToRobot: boolean;
};
