export type RelationalHistoryAnchor = {
  id: string;
  tableName: string;
  fields: Record<string, string | null>;
};

export type RelationalHistoryOption = {
  id: string;
  source: string | null;
  notes: string | null;
  isWinner: boolean;
  subtreeIds: Record<string, string | null>;
};

export type RelationalHistoryGroup = {
  conflictType: string;
  relatedTable: string;
  options: RelationalHistoryOption[];
};

export type RelationalHistoryResponse = {
  anchor: RelationalHistoryAnchor;
  groups: RelationalHistoryGroup[];
  resolverName: string | null;
  resolutionDate: string | null;
  resolutionNotes: string | null;
};
