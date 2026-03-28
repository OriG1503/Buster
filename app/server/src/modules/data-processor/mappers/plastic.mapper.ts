import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { PlasticInsertData } from '../../entities/plastic/types/plastic-insert-data.type';
import { ParsedPlasticRow } from '../types/parsed-row.type';
import { nullIfEmpty } from './mapper.utils';

export const mapPlasticRow = (raw: ParsedPlasticRow | null): MappedEntity<PlasticInsertData> | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.plastic_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    plasticType: nullIfEmpty(raw.plastic_type),
    batteryId: raw.battery ? nullIfEmpty(raw.battery.battery_UUID) : null,
  };
};
