export type SaleInsertData = {
  id: string;
  carrier: string | null;
  onlineStoreName: string | null;
  salesperson: string | null;
  isPurchased: boolean | null;
  isStockAshdod: boolean | null;
  isStockTelAviv: boolean | null;
  isStockRehovot: boolean | null;
  notes: string | null;
  dataSource: string | null;
};
