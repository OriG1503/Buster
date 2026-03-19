import { TableCell } from './table-cell.type';

/** Keys are namespaced column keys: e.g. "robots.id", "sensors.sensorType". */
export type TableRow = Record<string, TableCell>;

export type TableViewResponse = {
  rows: TableRow[];
  total: number;
};
