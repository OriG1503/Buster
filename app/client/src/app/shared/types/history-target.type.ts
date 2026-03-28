type ValueHistoryTarget = {
  isRelational: false;
  tableName: string;
  entityId: string;
  columnName: string;
  anchorTop: number;
  anchorBottom: number;
  anchorCenterX: number;
};

type RelationalHistoryTarget = {
  isRelational: true;
  anchorTable: string;
  anchorId: string;
  relatedTable: string;
  anchorTop: number;
  anchorBottom: number;
  anchorCenterX: number;
};

export type HistoryTarget = ValueHistoryTarget | RelationalHistoryTarget;
