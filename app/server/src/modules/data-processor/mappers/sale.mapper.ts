import { ParsedRow } from '../types/parsed-row.type';
import { MappedSale } from '../types/mapped-sale.type';
import { nullIfEmpty, parseBool } from './mapper.utils';

export const mapSaleRow = (row: ParsedRow): MappedSale | null => {
  const raw = row.sale;
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.sale_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    carrier: nullIfEmpty(raw.carrier),
    onlineStoreName: nullIfEmpty(raw.online_store_name),
    salesperson: nullIfEmpty(raw.salesperson),
    isPurchased: parseBool(raw.is_purchased),
    isStockAshdod: parseBool(raw.is_stock_ashdod),
    isStockTelAviv: parseBool(raw.is_stock_tel_aviv),
    isStockRehovot: parseBool(raw.is_stock_rehovot),
    dataSource: nullIfEmpty(raw.data_source),
  };
};
