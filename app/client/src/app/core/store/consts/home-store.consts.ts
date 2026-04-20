import { ENTITY_COLUMN_TREE } from '../../../shared/consts/entity-column-tree.consts';

export const HOME_PAGE_SIZE = 20;
export const DEFAULT_TABLE = 'robots';
export const VALID_TABLES = new Set(Object.keys(ENTITY_COLUMN_TREE));

export const ROBOT_DEFAULT_COLUMNS: string[] = [
  'robots.id',
  'plastics.id',
  'batteries.id',
  'irons.id',
  'wirings.id',
  'sensors.id',
  'communications.id',
  'storages.id',
  'cardboards.id',
  'robots.carrier',
  'robots.isPurchased',
  'robots.district',
  'robots.storeName',
  'robots.isStockAshdod',
  'robots.isStockTelAviv',
  'robots.isStockRehovot',
  'robots.isStockNetanya',
  'robots.isStockAfula',
];
