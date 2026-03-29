export type ConflictHistoryEntry = {
  value: string | null;
  source: string | null;
  notes: string | null;
  sourceTime: string | null;
  createdAt: string | null;
  isWinner: boolean;
};

export type ConflictHistoryResponse = {
  entries: ConflictHistoryEntry[];
  resolverName: string | null;
  resolutionDate: string | null;
  resolutionNotes: string | null;
};
