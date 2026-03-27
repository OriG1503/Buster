type ValueHistoryTarget = {
  isRelational: false;
  tableName: string;
  entityId: string;
  columnName: string;
  anchorBottom: number;
  anchorCenterX: number;
};

type RelationalHistoryTarget = {
  isRelational: true;
  anchorTable: string;
  anchorId: string;
  relatedTable: string;
  anchorBottom: number;
  anchorCenterX: number;
};

export type HistoryTarget = ValueHistoryTarget | RelationalHistoryTarget;
