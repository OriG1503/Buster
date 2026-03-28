import { EntityRowBase } from './mapped-entity-base.type';

export type ParsedBatteryRow = EntityRowBase & {
  battery_UUID: string;
  sku: string | null;
  battery_type: string | null;
  battery_version: string | null;
  lithium_version: string | null;
  battery_name: string | null;
  sales_person: string | null;
  battery_is_stock_tel_aviv: string | null;
  battery_is_stock_rehovot: string | null;
};

export type ParsedStorageRow = EntityRowBase & {
  storage_UUID: string;
  storage_type: string | null;
  storage_version: string | null;
  storage_is_stock_netanya: string | null;
  storage_is_stock_afula: string | null;
};

export type ParsedIronRow = EntityRowBase & {
  iron_UUID: string;
  iron_type: string | null;
  iron_version: string | null;
  is_heat_conductor: string | null;
  iron_is_stock_ashdod: string | null;
};

export type ParsedPlasticRow = EntityRowBase & {
  plastic_UUID: string;
  plastic_type: string | null;
  battery: ParsedBatteryRow | null;
};

export type ParsedWiringRow = EntityRowBase & {
  wiring_UUID: string;
  wiring_type: string | null;
  wiring_district: string | null;
  wiring_store_name: string | null;
  storage: ParsedStorageRow | null;
};

export type ParsedCommunicationRow = EntityRowBase & {
  communication_UUID: string;
  communication_type: string | null;
  plastic: ParsedPlasticRow | null;
  iron: ParsedIronRow | null;
};

export type ParsedCardboardRow = EntityRowBase & {
  cardboard_UUID: string;
  cardboard_type: string | null;
  cardboard_version: string | null;
};

export type ParsedSensorRow = EntityRowBase & {
  sensor_UUID: string;
  sensor_type: string | null;
  sensor_version: string | null;
};

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
  cardboard: ParsedCardboardRow | null;
  sensor: ParsedSensorRow | null;
  communication: ParsedCommunicationRow | null;
  wiring: ParsedWiringRow | null;
};
