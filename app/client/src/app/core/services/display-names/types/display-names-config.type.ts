export type ColumnValueType = 'id' | 'string' | 'bool' | 'fk' | 'meta';

export type ColumnDisplayConfig = {
  label: string;
  csvHeader: string;
  parserFieldName: string;
  valueType: ColumnValueType;
};

export type EntityDisplayConfig = {
  tableName: string;
  displayName: string;
  pluralDisplayName: string;
  columns: Record<string, ColumnDisplayConfig>;
};

export type DisplayNamesConfig = Record<string, EntityDisplayConfig>;
