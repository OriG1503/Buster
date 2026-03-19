import { ParsedRow } from '../types/parsed-row.type';
import { MappedCardboard } from '../types/mapped-cardboard.type';
import { nullIfEmpty } from './mapper.utils';

export const mapCardboardRow = (row: ParsedRow): MappedCardboard | null => {
  const raw = row.cardboard;
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.cardboard_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    cardboardType: nullIfEmpty(raw.cardboard_type),
    cardboardVersion: nullIfEmpty(raw.cardboard_version),
  };
};
