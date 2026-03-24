/** Structural backbone of the column tree. Labels are provided at runtime by DisplayNamesService. */
export type ColumnGroupStructure = {
  entityTable: string;
  columns: string[];
};

const SENSOR_GROUP: ColumnGroupStructure = {
  entityTable: 'sensors',
  columns: ['sensors.id', 'sensors.sensorType', 'sensors.sensorVersion'],
};

const STORAGE_GROUP: ColumnGroupStructure = {
  entityTable: 'storages',
  columns: ['storages.id', 'storages.storageType', 'storages.storageVersion', 'storages.isStockNetanya', 'storages.isStockAfula'],
};

const BATTERY_GROUP: ColumnGroupStructure = {
  entityTable: 'batteries',
  columns: ['batteries.id', 'batteries.sku', 'batteries.batteryType', 'batteries.batteryVersion', 'batteries.lithiumVersion'],
};

const IRON_GROUP: ColumnGroupStructure = {
  entityTable: 'irons',
  columns: ['irons.id', 'irons.ironType', 'irons.ironVersion', 'irons.isHeatConductor'],
};

const PLASTIC_GROUP: ColumnGroupStructure = {
  entityTable: 'plastics',
  columns: ['plastics.id', 'plastics.plasticType', 'plastics.batteryId'],
};

const CARDBOARD_GROUP: ColumnGroupStructure = {
  entityTable: 'cardboards',
  columns: ['cardboards.id', 'cardboards.cardboardType', 'cardboards.cardboardVersion'],
};

const SALE_GROUP: ColumnGroupStructure = {
  entityTable: 'sales',
  columns: [
    'sales.id',
    'sales.carrier',
    'sales.onlineStoreName',
    'sales.salesperson',
    'sales.isPurchased',
    'sales.isStockAshdod',
    'sales.isStockTelAviv',
    'sales.isStockRehovot',
    'sales.dataSource',
  ],
};

const COMMUNICATION_GROUP: ColumnGroupStructure = {
  entityTable: 'communications',
  columns: ['communications.id', 'communications.communicationType', 'communications.plasticId', 'communications.ironId'],
};

const WIRING_GROUP: ColumnGroupStructure = {
  entityTable: 'wirings',
  columns: ['wirings.id', 'wirings.wiringType', 'wirings.district', 'wirings.municipality', 'wirings.storageId'],
};

const ROBOT_GROUP: ColumnGroupStructure = {
  entityTable: 'robots',
  columns: [
    'robots.id',
    'robots.cardboardId',
    'robots.sensorId',
    'robots.communicationId',
    'robots.saleId',
    'robots.wiringId',
  ],
};

export const ENTITY_COLUMN_TREE: Record<string, ColumnGroupStructure[]> = {
  robots: [ROBOT_GROUP, CARDBOARD_GROUP, SENSOR_GROUP, COMMUNICATION_GROUP, PLASTIC_GROUP, BATTERY_GROUP, IRON_GROUP, SALE_GROUP, WIRING_GROUP, STORAGE_GROUP],
  sensors: [SENSOR_GROUP, ROBOT_GROUP],
  wirings: [WIRING_GROUP, STORAGE_GROUP, ROBOT_GROUP],
  communications: [COMMUNICATION_GROUP, PLASTIC_GROUP, BATTERY_GROUP, IRON_GROUP, ROBOT_GROUP],
  batteries: [BATTERY_GROUP, PLASTIC_GROUP, IRON_GROUP, COMMUNICATION_GROUP, ROBOT_GROUP],
  storages: [STORAGE_GROUP, WIRING_GROUP, ROBOT_GROUP],
  irons: [IRON_GROUP, COMMUNICATION_GROUP, PLASTIC_GROUP, BATTERY_GROUP, ROBOT_GROUP],
  plastics: [PLASTIC_GROUP, BATTERY_GROUP, IRON_GROUP, COMMUNICATION_GROUP, ROBOT_GROUP],
  cardboards: [CARDBOARD_GROUP, ROBOT_GROUP],
  sales: [SALE_GROUP, ROBOT_GROUP],
};
