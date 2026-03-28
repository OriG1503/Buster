export const ALLOWED_TABLES = new Set([
  'robots',
  'sensors',
  'wirings',
  'communications',
  'batteries',
  'storages',
  'irons',
  'plastics',
  'cardboards',
  'sales',
]);

export const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  robots: new Set(['id', 'cardboardId', 'sensorId', 'communicationId', 'saleId', 'wiringId']),
  sensors: new Set(['id', 'sensorType', 'sensorVersion']),
  wirings: new Set(['id', 'wiringType', 'district', 'municipality', 'storageId']),
  communications: new Set(['id', 'communicationType', 'plasticId', 'ironId']),
  batteries: new Set(['id', 'sku', 'batteryType', 'batteryVersion', 'lithiumVersion', 'batteryName', 'salesperson']),
  storages: new Set(['id', 'storageType', 'storageVersion', 'isStockNetanya', 'isStockAfula']),
  irons: new Set(['id', 'ironType', 'ironVersion', 'isHeatConductor']),
  plastics: new Set(['id', 'plasticType', 'batteryId']),
  cardboards: new Set(['id', 'cardboardType', 'cardboardVersion']),
  sales: new Set(['id', 'carrier', 'onlineStoreName', 'salesperson', 'isPurchased', 'isStockAshdod', 'isStockTelAviv', 'isStockRehovot', 'dataSource']),
};
