export type CellStatus = 'raw' | 'open' | 'resolved';

export type TableCell = {
  value: string | null;
  status: CellStatus;
  source: string | null;
  notes: string | null;
  /** ISO timestamp of the entity row's creation — used as the upload date in the raw-cell popup. */
  uploadedAt: string | null;
  /** ISO timestamp entered by the user in the Excel upload — the date the source data was recorded. */
  sourceTime: string | null;
  /** Present when status = 'open'; the ConflictEntity id for navigation to the conflicts page. */
  conflictId: number | null;
  /** For relational conflicts: the anchor table to navigate to on the conflicts page. Null for value conflicts. */
  anchorTable: string | null;
  /** For relational conflicts: the anchor entity ID to open on the conflicts page. Null for value conflicts. */
  anchorId: string | null;
  /** For relational conflicts: the related table (the competing options' table). Null for value conflicts. */
  relatedTable: string | null;
  /** True when this conflict originated from a cross-entity (robot-wiring) conflict. */
  isCrossEntity: boolean;
};
