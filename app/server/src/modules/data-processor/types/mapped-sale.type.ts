import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedSale extends MappedEntityBase {
  carrier: string | null;
  onlineStoreName: string | null;
  salesperson: string | null;
  isPurchased: boolean | null;
  isStockAshdod: boolean | null;
  isStockTelAviv: boolean | null;
  isStockRehovot: boolean | null;
  dataSource: string | null;
}
