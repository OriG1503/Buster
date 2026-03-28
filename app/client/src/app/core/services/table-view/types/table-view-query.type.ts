export type TableViewQuery = {
  tableName: string;
  columns: string[];
  filters: Record<string, string>;
  page: number;
  pageSize: number;
};
