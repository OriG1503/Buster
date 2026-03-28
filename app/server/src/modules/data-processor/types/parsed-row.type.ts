import { EntityRowBase } from './mapped-entity-base.type';

export interface ParsedBatteryRow extends EntityRowBase {
  battery_UUID: string;
  sku: string | null;
  battery_type: string | null;
  battery_version: string | null;
  lithium_version: string | null;
  battery_name: string | null;
  sales_person: string | null;
}

export interface ParsedStorageRow extends EntityRowBase {
  storage_UUID: string;
  storage_type: string | null;
  storage_version: string | null;
  is_stock_netanya: string | null;
  is_stock_afula: string | null;
}

export interface ParsedIronRow extends EntityRowBase {
  iron_UUID: string;
  iron_type: string | null;
  iron_version: string | null;
  is_heat_conductor: string | null;
}

export interface ParsedPlasticRow extends EntityRowBase {
  plastic_UUID: string;
  plastic_type: string | null;
  battery: ParsedBatteryRow | null;
}

export interface ParsedWiringRow extends EntityRowBase {
  wiring_UUID: string;
  wiring_type: string | null;
  district: string | null;
  store_name: string | null;
  storage: ParsedStorageRow | null;
}

export interface ParsedCommunicationRow extends EntityRowBase {
  communication_UUID: string;
  communication_type: string | null;
  plastic: ParsedPlasticRow | null;
  iron: ParsedIronRow | null;
}

export interface ParsedCardboardRow extends EntityRowBase {
  cardboard_UUID: string;
  cardboard_type: string | null;
  cardboard_version: string | null;
}

export interface ParsedSensorRow extends EntityRowBase {
  sensor_UUID: string;
  sensor_type: string | null;
  sensor_version: string | null;
}

export interface ParsedRow extends EntityRowBase {
  robot_UUID: string;
  cardboard: ParsedCardboardRow | null;
  sensor: ParsedSensorRow | null;
  communication: ParsedCommunicationRow | null;
  wiring: ParsedWiringRow | null;
}
