export type TableViewQueryDto = {
  /** Root entity table name (e.g. "robots"). */
  tableName: string;
  /** Namespaced column keys to include (e.g. ["robots.id", "sensors.sensorType"]). */
  columns: string[];
  /** Per-column filter strings; key = namespaced column key, value = search text. */
  filters: Record<string, string>;
  /** 1-based page number. */
  page: number;
  /** Rows per page. */
  pageSize: number;
};
