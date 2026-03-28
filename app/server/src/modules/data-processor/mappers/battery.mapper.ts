import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { BatteryInsertData } from '../../entities/battery/types/battery-insert-data.type';
import { ParsedBatteryRow } from '../types/parsed-row.type';
import { nullIfEmpty, parseBool } from './mapper.utils';

export const mapBatteryRow = (raw: ParsedBatteryRow | null): MappedEntity<BatteryInsertData> | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.battery_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    sku: nullIfEmpty(raw.sku),
    batteryType: nullIfEmpty(raw.battery_type),
    batteryVersion: nullIfEmpty(raw.battery_version),
    lithiumVersion: nullIfEmpty(raw.lithium_version),
    batteryName: nullIfEmpty(raw.battery_name),
    salesPerson: nullIfEmpty(raw.sales_person),
    isStockTelAviv: parseBool(raw.battery_is_stock_tel_aviv),
    isStockRehovot: parseBool(raw.battery_is_stock_rehovot),
  };
};
