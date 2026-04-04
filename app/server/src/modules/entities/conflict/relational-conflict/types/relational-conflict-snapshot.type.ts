export type RelationalConflictSnapshot = {
  anchor: Record<string, unknown>;
  oldRelated: Record<string, unknown>;
  newRelated: Record<string, unknown>;
};
