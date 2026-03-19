import { ColumnGroup } from '../types/column-group.type';

const SENSOR_GROUP: ColumnGroup = {
  entityTable: 'sensors',
  label: 'חיישנים',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'sensorType', label: 'סוג חיישן' },
    { key: 'sensorVersion', label: 'גרסת חיישן' },
  ],
};

const STORAGE_GROUP: ColumnGroup = {
  entityTable: 'storages',
  label: 'אחסון',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'storageType', label: 'סוג אחסון' },
    { key: 'storageVersion', label: 'גרסת אחסון' },
    { key: 'isStockNetanya', label: 'מלאי נתניה' },
    { key: 'isStockAfula', label: 'מלאי עפולה' },
  ],
};

const BATTERY_GROUP: ColumnGroup = {
  entityTable: 'batteries',
  label: 'סוללות',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'sku', label: 'מק"ט' },
    { key: 'batteryType', label: 'סוג סוללה' },
    { key: 'batteryVersion', label: 'גרסת סוללה' },
    { key: 'lithiumVersion', label: 'גרסת ליתיום' },
  ],
};

const IRON_GROUP: ColumnGroup = {
  entityTable: 'irons',
  label: 'ברזל',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'ironType', label: 'סוג ברזל' },
    { key: 'ironVersion', label: 'גרסת ברזל' },
    { key: 'isHeatConductor', label: 'מוליך חום' },
  ],
};

const PLASTIC_GROUP: ColumnGroup = {
  entityTable: 'plastics',
  label: 'פלסטיק',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'plasticType', label: 'סוג פלסטיק' },
    { key: 'batteryId', label: 'מזהה סוללה' },
  ],
};

const CARDBOARD_GROUP: ColumnGroup = {
  entityTable: 'cardboards',
  label: 'קרטון',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'cardboardType', label: 'סוג קרטון' },
    { key: 'cardboardVersion', label: 'גרסת קרטון' },
  ],
};

const SALE_GROUP: ColumnGroup = {
  entityTable: 'sales',
  label: 'מכירות',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'carrier', label: 'ספק שילוח' },
    { key: 'onlineStoreName', label: 'שם חנות מקוונת' },
    { key: 'salesperson', label: 'איש מכירות' },
    { key: 'isPurchased', label: 'נרכש' },
    { key: 'isStockAshdod', label: 'מלאי אשדוד' },
    { key: 'isStockTelAviv', label: 'מלאי תל אביב' },
    { key: 'isStockRehovot', label: 'מלאי רחובות' },
    { key: 'dataSource', label: 'מקור נתונים' },
  ],
};

const COMMUNICATION_GROUP: ColumnGroup = {
  entityTable: 'communications',
  label: 'תקשורת',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'communicationType', label: 'סוג תקשורת' },
    { key: 'plasticId', label: 'מזהה פלסטיק' },
    { key: 'ironId', label: 'מזהה ברזל' },
  ],
};

const WIRING_GROUP: ColumnGroup = {
  entityTable: 'wirings',
  label: 'כבלים',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'wiringType', label: 'סוג כבל' },
    { key: 'district', label: 'מחוז' },
    { key: 'municipality', label: 'עיריה' },
    { key: 'storageId', label: 'מזהה אחסון' },
  ],
};

const ROBOT_GROUP: ColumnGroup = {
  entityTable: 'robots',
  label: 'רובוטים',
  columns: [
    { key: 'id', label: 'מזהה' },
    { key: 'cardboardId', label: 'מזהה קרטון' },
    { key: 'sensorId', label: 'מזהה חיישן' },
    { key: 'communicationId', label: 'מזהה תקשורת' },
    { key: 'saleId', label: 'מזהה מכירה' },
    { key: 'wiringId', label: 'מזהה כבל' },
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
