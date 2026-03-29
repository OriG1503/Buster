export type ColumnValueType = 'id' | 'string' | 'bool' | 'fk' | 'meta';

export type FieldConfig = {
  label: string;       // client display name (e.g., "מחוז")
  csvHeader: string;   // CSV template column header — may differ from label (e.g., "מחוז רובוט")
  parserFieldName: string;
  valueType: ColumnValueType;
};

export type EntityConfig = {
  tableName: string;
  displayName: string;
  pluralDisplayName: string;
  columns: Record<string, FieldConfig>;
};

type EntityColumnsBase = Record<string, FieldConfig>;

/**
 * Derives a typed insert-data shape from an entity's column config.
 * 'id'     → string (non-nullable primary key)
 * 'string' → string | null
 * 'bool'   → boolean | null
 * 'fk'     → string | null (FK to another entity's UUID)
 * 'meta'   → excluded (source / notes are tracked separately)
 */
export type EntityInsertData<C extends EntityColumnsBase> =
  { [K in keyof C as C[K]['valueType'] extends 'id' ? K : never]: string } &
  { [K in keyof C as C[K]['valueType'] extends 'string' ? K : never]: string | null } &
  { [K in keyof C as C[K]['valueType'] extends 'bool' ? K : never]: boolean | null } &
  { [K in keyof C as C[K]['valueType'] extends 'fk' ? K : never]: string | null };
