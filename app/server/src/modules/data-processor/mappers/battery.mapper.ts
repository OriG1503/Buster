import { ParsedBatteryRow } from '../types/parsed-row.type';
import { MappedBattery } from '../types/mapped-battery.type';
import { nullIfEmpty } from './mapper.utils';

export const mapBatteryRow = (raw: ParsedBatteryRow | null): MappedBattery | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.battery_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    sku: nullIfEmpty(raw.sku),
    batteryType: nullIfEmpty(raw.battery_type),
    batteryVersion: nullIfEmpty(raw.battery_version),
    lithiumVersion: nullIfEmpty(raw.lithium_version),
  };
};
