import { EntityRowBase } from './mapped-entity-base.type';

// Minimal section types — only the UUID field is explicitly typed; scalar fields are accessed generically by the mapper.
type BatterySection = EntityRowBase & { battery_UUID: string | null };
type StorageSection = EntityRowBase & { storage_UUID: string | null };
type IronSection = EntityRowBase & { iron_UUID: string | null };
type CardboardSection = EntityRowBase & { cardboard_UUID: string | null };
type SensorSection = EntityRowBase & { sensor_UUID: string | null };

/** Exported hierarchy types — used by ParsedRowEnricher and anywhere the parser hierarchy is navigated. */
export type ParsedPlasticRow = EntityRowBase & { plastic_UUID: string | null; battery: BatterySection | null };
export type ParsedWiringRow = EntityRowBase & { wiring_UUID: string | null; storage: StorageSection | null };
export type ParsedCommunicationRow = EntityRowBase & { communication_UUID: string | null; plastic: ParsedPlasticRow | null; iron: IronSection | null };

/** Top-level row returned by the Python parser for a single CSV record. */
export type ParsedRow = EntityRowBase & {
  robot_UUID: string;
  carrier: string | null;
  is_purchased: string | null;
  robot_district: string | null;
  robot_store_name: string | null;
  robot_is_stock_ashdod: string | null;
  robot_is_stock_tel_aviv: string | null;
  robot_is_stock_rehovot: string | null;
  robot_is_stock_netanya: string | null;
  robot_is_stock_afula: string | null;
  cardboard: CardboardSection | null;
  sensor: SensorSection | null;
  communication: ParsedCommunicationRow | null;
  wiring: ParsedWiringRow | null;
};
