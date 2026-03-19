import { TableCell } from './table-cell.type';

export type TableRow = Record<string, TableCell>;

export type TableViewResponse = {
  rows: TableRow[];
  total: number;
};
