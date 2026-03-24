export type ColumnDisplayConfig = {
  label: string;
  parserFieldName: string;
};

export type EntityDisplayConfig = {
  displayName: string;
  pluralDisplayName: string;
  columns: Record<string, ColumnDisplayConfig>;
};

export type DisplayNamesConfig = Record<string, EntityDisplayConfig>;
