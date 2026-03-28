import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { CardboardInsertData } from '../../entities/cardboard/types/cardboard-insert-data.type';
import { ParsedRow } from '../types/parsed-row.type';
import { nullIfEmpty } from './mapper.utils';

export const mapCardboardRow = (row: ParsedRow): MappedEntity<CardboardInsertData> | null => {
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
