import { TableRow } from '../../../shared/types/table-view-response.type';

export type HomeState = {
  selectedTable: string;
  selectedColumns: string[];
  filters: Record<string, string>;
  page: number;
  rows: TableRow[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  refreshTick: number;
};
