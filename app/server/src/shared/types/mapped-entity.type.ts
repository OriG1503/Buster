/** Generic wrapper that turns any insert-data shape into a fully-tracked mapped entity (adds source + notes). */
export type MappedEntity<TInsertData extends { id: string }> = TInsertData & {
  source: string;
  notes: string | null;
};
