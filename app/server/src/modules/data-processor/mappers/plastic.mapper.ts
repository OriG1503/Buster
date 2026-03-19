import { ParsedPlasticRow } from '../types/parsed-row.type';
import { MappedPlastic } from '../types/mapped-plastic.type';
import { nullIfEmpty } from './mapper.utils';

export const mapPlasticRow = (raw: ParsedPlasticRow | null): MappedPlastic | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.plastic_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    plasticType: nullIfEmpty(raw.plastic_type),
    batteryId: raw.battery ? nullIfEmpty(raw.battery.battery_UUID) : null,
  };
};
