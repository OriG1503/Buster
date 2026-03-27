export type ConflictHistoryEntry = {
  value: string | null;
  source: string | null;
  notes: string | null;
  /** ISO timestamp — when this value was uploaded (conflict createdAt for incoming values; entity createdAt for original). */
  createdAt: string | null;
  /** True for the entry that matches the current entity field value (the winning value). */
  isWinner: boolean;
};

export type ConflictHistoryResponse = {
  entries: ConflictHistoryEntry[];
  resolverName: string | null;
  /** ISO timestamp — when the conflict was resolved (last resolved conflict's updatedAt). */
  resolutionDate: string | null;
  resolutionNotes: string | null;
};
