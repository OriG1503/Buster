import { ParsedRow } from '../types/parsed-row.type';
import { MappedWiring } from '../types/mapped-wiring.type';
import { nullIfEmpty } from './mapper.utils';

export const mapWiringRow = (row: ParsedRow): MappedWiring | null => {
  const raw = row.wiring;
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.wiring_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    wiringType: nullIfEmpty(raw.wiring_type),
    district: nullIfEmpty(raw.district),
    municipality: nullIfEmpty(raw.municipality),
    storageId: raw.storage ? nullIfEmpty(raw.storage.storage_UUID) : null,
  };
};
