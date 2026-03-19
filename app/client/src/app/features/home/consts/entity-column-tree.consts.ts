import { ColumnGroup } from '../types/column-group.type';

const SENSOR_GROUP: ColumnGroup = {
  entityTable: 'sensors',
  label: 'חיישנים',
  columns: [
    { key: 'sensors.id', label: 'מזהה' },
    { key: 'sensors.sensorType', label: 'סוג חיישן' },
    { key: 'sensors.sensorVersion', label: 'גרסת חיישן' },
  ],
};

const STORAGE_GROUP: ColumnGroup = {
  entityTable: 'storages',
  label: 'אחסון',
  columns: [
    { key: 'storages.id', label: 'מזהה' },
    { key: 'storages.storageType', label: 'סוג אחסון' },
    { key: 'storages.storageVersion', label: 'גרסת אחסון' },
    { key: 'storages.isStockNetanya', label: 'מלאי נתניה' },
    { key: 'storages.isStockAfula', label: 'מלאי עפולה' },
  ],
};

const BATTERY_GROUP: ColumnGroup = {
  entityTable: 'batteries',
  label: 'סוללות',
  columns: [
    { key: 'batteries.id', label: 'מזהה' },
    { key: 'batteries.sku', label: 'מק"ט' },
    { key: 'batteries.batteryType', label: 'סוג סוללה' },
    { key: 'batteries.batteryVersion', label: 'גרסת סוללה' },
    { key: 'batteries.lithiumVersion', label: 'גרסת ליתיום' },
  ],
};

const IRON_GROUP: ColumnGroup = {
  entityTable: 'irons',
  label: 'ברזל',
  columns: [
    { key: 'irons.id', label: 'מזהה' },
    { key: 'irons.ironType', label: 'סוג ברזל' },
    { key: 'irons.ironVersion', label: 'גרסת ברזל' },
    { key: 'irons.isHeatConductor', label: 'מוליך חום' },
  ],
};

const PLASTIC_GROUP: ColumnGroup = {
  entityTable: 'plastics',
  label: 'פלסטיק',
  columns: [
    { key: 'plastics.id', label: 'מזהה' },
    { key: 'plastics.plasticType', label: 'סוג פלסטיק' },
    { key: 'plastics.batteryId', label: 'מזהה סוללה' },
  ],
};

const CARDBOARD_GROUP: ColumnGroup = {
  entityTable: 'cardboards',
  label: 'קרטון',
  columns: [
    { key: 'cardboards.id', label: 'מזהה' },
    { key: 'cardboards.cardboardType', label: 'סוג קרטון' },
    { key: 'cardboards.cardboardVersion', label: 'גרסת קרטון' },
  ],
};

const SALE_GROUP: ColumnGroup = {
  entityTable: 'sales',
  label: 'מכירות',
  columns: [
    { key: 'sales.id', label: 'מזהה' },
    { key: 'sales.carrier', label: 'ספק שילוח' },
    { key: 'sales.onlineStoreName', label: 'שם חנות מקוונת' },
    { key: 'sales.salesperson', label: 'איש מכירות' },
    { key: 'sales.isPurchased', label: 'נרכש' },
    { key: 'sales.isStockAshdod', label: 'מלאי אשדוד' },
    { key: 'sales.isStockTelAviv', label: 'מלאי תל אביב' },
    { key: 'sales.isStockRehovot', label: 'מלאי רחובות' },
    { key: 'sales.dataSource', label: 'מקור נתונים' },
  ],
};

const COMMUNICATION_GROUP: ColumnGroup = {
  entityTable: 'communications',
  label: 'תקשורת',
  columns: [
    { key: 'communications.id', label: 'מזהה' },
    { key: 'communications.communicationType', label: 'סוג תקשורת' },
    { key: 'communications.plasticId', label: 'מזהה פלסטיק' },
    { key: 'communications.ironId', label: 'מזהה ברזל' },
  ],
};

const WIRING_GROUP: ColumnGroup = {
  entityTable: 'wirings',
  label: 'כבלים',
  columns: [
    { key: 'wirings.id', label: 'מזהה' },
    { key: 'wirings.wiringType', label: 'סוג כבל' },
    { key: 'wirings.district', label: 'מחוז' },
    { key: 'wirings.municipality', label: 'עיריה' },
    { key: 'wirings.storageId', label: 'מזהה אחסון' },
  ],
};

const ROBOT_GROUP: ColumnGroup = {
  entityTable: 'robots',
  label: 'רובוטים',
  columns: [
    { key: 'robots.id', label: 'מזהה' },
    { key: 'robots.cardboardId', label: 'מזהה קרטון' },
    { key: 'robots.sensorId', label: 'מזהה חיישן' },
    { key: 'robots.communicationId', label: 'מזהה תקשורת' },
    { key: 'robots.saleId', label: 'מזהה מכירה' },
    { key: 'robots.wiringId', label: 'מזהה כבל' },
  ],
};

export const ENTITY_COLUMN_TREE: Record<string, ColumnGroup[]> = {
  robots: [ROBOT_GROUP, CARDBOARD_GROUP, SENSOR_GROUP, COMMUNICATION_GROUP, PLASTIC_GROUP, BATTERY_GROUP, IRON_GROUP, SALE_GROUP, WIRING_GROUP, STORAGE_GROUP],
  sensors: [SENSOR_GROUP],
  wirings: [WIRING_GROUP, STORAGE_GROUP],
  communications: [COMMUNICATION_GROUP, PLASTIC_GROUP, BATTERY_GROUP, IRON_GROUP],
  batteries: [BATTERY_GROUP],
  storages: [STORAGE_GROUP],
  irons: [IRON_GROUP],
  plastics: [PLASTIC_GROUP, BATTERY_GROUP],
  cardboards: [CARDBOARD_GROUP],
  sales: [SALE_GROUP],
};
