import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { WiringInsertData } from '../../entities/wiring/types/wiring-insert-data.type';
import { ParsedRow } from '../types/parsed-row.type';
import { nullIfEmpty } from './mapper.utils';

export const mapWiringRow = (row: ParsedRow): MappedEntity<WiringInsertData> | null => {
  const raw = row.wiring;
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.wiring_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    wiringType: nullIfEmpty(raw.wiring_type),
    district: nullIfEmpty(raw.wiring_district),
    storeName: nullIfEmpty(raw.wiring_store_name),
    storageId: raw.storage ? nullIfEmpty(raw.storage.storage_UUID) : null,
  };
};
