export type CrossEntityHistoryEntry = {
  entityId: string;
  entityTable: string;
  value: string | null;
  source: string | null;
  notes: string | null;
  sourceTime: string | null;
  isWinner: boolean;
};

export type CrossEntityHistoryResponse = {
  fieldName: string;
  entries: CrossEntityHistoryEntry[];
  resolverName: string | null;
  resolutionDate: string | null;
  resolutionNotes: string | null;
};
