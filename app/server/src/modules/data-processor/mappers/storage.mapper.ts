import { ParsedStorageRow } from '../types/parsed-row.type';
import { MappedStorage } from '../types/mapped-storage.type';
import { nullIfEmpty, parseBool } from './mapper.utils';

export const mapStorageRow = (raw: ParsedStorageRow | null): MappedStorage | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.storage_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    storageType: nullIfEmpty(raw.storage_type),
    storageVersion: nullIfEmpty(raw.storage_version),
    isStockNetanya: parseBool(raw.storage_is_stock_netanya),
    isStockAfula: parseBool(raw.storage_is_stock_afula),
  };
};
