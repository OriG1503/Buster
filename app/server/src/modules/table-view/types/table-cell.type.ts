export type CellStatus = 'raw' | 'open' | 'resolved';

export type TableCell = {
  value: string | null;
  status: CellStatus;
  source: string | null;
  notes: string | null;
  /** ISO timestamp of the entity row's creation — used as the upload date in the raw-cell popup. */
  uploadedAt: string | null;
  /** Present when status = 'open'; the ConflictEntity id for navigation to the conflicts page. */
  conflictId: number | null;
};
