export type ParsedBatteryRow = {
  battery_UUID: string;
  notes: string | null;
  source: string;
  sku: string | null;
  battery_type: string | null;
  battery_version: string | null;
  lithium_version: string | null;
};

export type ParsedStorageRow = {
  storage_UUID: string;
  notes: string | null;
  source: string;
  storage_type: string | null;
  storage_version: string | null;
  is_stock_netanya: string | null;
  is_stock_afula: string | null;
};

export type ParsedIronRow = {
  iron_UUID: string;
  notes: string | null;
  source: string;
  iron_type: string | null;
  iron_version: string | null;
  is_heat_conductor: string | null;
};

export type ParsedPlasticRow = {
  plastic_UUID: string;
  notes: string | null;
  source: string;
  plastic_type: string | null;
  battery: ParsedBatteryRow | null;
};

export type ParsedWiringRow = {
  wiring_UUID: string;
  notes: string | null;
  source: string;
  wiring_type: string | null;
  district: string | null;
  municipality: string | null;
  storage: ParsedStorageRow | null;
};

export type ParsedCommunicationRow = {
  communication_UUID: string;
  notes: string | null;
  source: string;
  communication_type: string | null;
  plastic: ParsedPlasticRow | null;
  iron: ParsedIronRow | null;
};

export type ParsedCardboardRow = {
  cardboard_UUID: string;
  notes: string | null;
  source: string;
  cardboard_type: string | null;
  cardboard_version: string | null;
};

export type ParsedSensorRow = {
  sensor_UUID: string;
  notes: string | null;
  source: string;
  sensor_type: string | null;
  sensor_version: string | null;
};

export type ParsedSaleRow = {
  sale_UUID: string;
  notes: string | null;
  source: string;
  carrier: string | null;
  online_store_name: string | null;
  salesperson: string | null;
  is_purchased: string | null;
  is_stock_ashdod: string | null;
  is_stock_tel_aviv: string | null;
  is_stock_rehovot: string | null;
  data_source: string | null;
};

export type ParsedRow = {
  robot_UUID: string;
  notes: string | null;
  source: string;
  cardboard: ParsedCardboardRow | null;
  sensor: ParsedSensorRow | null;
  communication: ParsedCommunicationRow | null;
  wiring: ParsedWiringRow | null;
  sale: ParsedSaleRow | null;
};
