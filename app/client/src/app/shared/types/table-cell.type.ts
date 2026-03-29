export type CellStatus = 'raw' | 'open' | 'resolved';

export type TableCell = {
  value: string | null;
  status: CellStatus;
  source: string | null;
  notes: string | null;
  sourceTime: string | null;
  uploadedAt: string | null;
  conflictId: number | null;
  anchorTable: string | null;
  anchorId: string | null;
  relatedTable: string | null;
};
