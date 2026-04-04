import { EntityConfig } from '../types/entity-config.type';

export const BATTERY_CONFIG = {
  tableName: 'batteries',
  displayName: 'סוללה',
  pluralDisplayName: 'סוללות',
  columns: {
    id:             { label: 'מזהה סוללה',    csvHeader: 'מזהה סוללה',          parserFieldName: 'battery_UUID',              valueType: 'id'     },
    sku:            { label: 'מק"ט',           csvHeader: 'מק"ט',                 parserFieldName: 'sku',                       valueType: 'string' },
    batteryType:    { label: 'סוג סוללה',      csvHeader: 'סוג סוללה',            parserFieldName: 'battery_type',              valueType: 'string' },
    batteryVersion: { label: 'גרסת סוללה',     csvHeader: 'גרסת סוללה',           parserFieldName: 'battery_version',           valueType: 'string' },
    lithiumVersion: { label: 'גרסת ליתיום',    csvHeader: 'גרסת ליתיום',          parserFieldName: 'lithium_version',           valueType: 'string' },
    batteryName:    { label: 'שם סוללה',       csvHeader: 'שם סוללה',             parserFieldName: 'battery_name',              valueType: 'string' },
    salesPerson:    { label: 'איש מכירות',     csvHeader: 'איש מכירות',           parserFieldName: 'sales_person',              valueType: 'string' },
    isStockTelAviv: { label: 'מלאי תל אביב סוללה',  csvHeader: 'מלאי תל אביב סוללה',  parserFieldName: 'battery_is_stock_tel_aviv', valueType: 'bool'   },
    isStockRehovot: { label: 'מלאי רחובות סוללה',   csvHeader: 'מלאי רחובות סוללה',   parserFieldName: 'battery_is_stock_rehovot', valueType: 'bool'   },
    notes:          { label: 'הערה',            csvHeader: 'הערה',                 parserFieldName: 'notes',                     valueType: 'meta'   },
    source:         { label: 'מ"ד',             csvHeader: 'מ"ד',                  parserFieldName: 'source',                    valueType: 'meta'   },
    sourceTime:     { label: 'תאריך מקור',      csvHeader: 'תאריך מקור',           parserFieldName: 'source_time',               valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const CARDBOARD_CONFIG = {
  tableName: 'cardboards',
  displayName: 'קרטון',
  pluralDisplayName: 'קרטונים',
  columns: {
    id:               { label: 'מזהה קרטון', csvHeader: 'מזהה קרטון',  parserFieldName: 'cardboard_UUID',    valueType: 'id'     },
    cardboardType:    { label: 'סוג קרטון',  csvHeader: 'סוג קרטון',   parserFieldName: 'cardboard_type',    valueType: 'string' },
    cardboardVersion: { label: 'גרסת קרטון', csvHeader: 'גרסת קרטון',  parserFieldName: 'cardboard_version', valueType: 'string' },
    notes:            { label: 'הערה',        csvHeader: 'הערה',         parserFieldName: 'notes',             valueType: 'meta'   },
    source:           { label: 'מ"ד',         csvHeader: 'מ"ד',          parserFieldName: 'source',            valueType: 'meta'   },
    sourceTime:       { label: 'תאריך מקור',  csvHeader: 'תאריך מקור',   parserFieldName: 'source_time',       valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const COMMUNICATION_CONFIG = {
  tableName: 'communications',
  displayName: 'תקשורת',
  pluralDisplayName: 'תקשורת',
  columns: {
    id:                { label: 'מזהה תקשורת', csvHeader: 'מזהה תקשורת', parserFieldName: 'communication_UUID',  valueType: 'id'     },
    plasticId:         { label: 'מזהה פלסטיק', csvHeader: 'מזהה פלסטיק', parserFieldName: 'plastic_UUID',        valueType: 'fk'     },
    ironId:            { label: 'מזהה ברזל',   csvHeader: 'מזהה ברזל',   parserFieldName: 'iron_UUID',           valueType: 'fk'     },
    communicationType: { label: 'סוג תקשורת',  csvHeader: 'סוג תקשורת',  parserFieldName: 'communication_type',  valueType: 'string' },
    notes:             { label: 'הערה',          csvHeader: 'הערה',         parserFieldName: 'notes',               valueType: 'meta'   },
    source:            { label: 'מ"ד',           csvHeader: 'מ"ד',          parserFieldName: 'source',              valueType: 'meta'   },
    sourceTime:        { label: 'תאריך מקור',    csvHeader: 'תאריך מקור',   parserFieldName: 'source_time',         valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const IRON_CONFIG = {
  tableName: 'irons',
  displayName: 'ברזל',
  pluralDisplayName: 'ברזלים',
  columns: {
    id:              { label: 'מזהה ברזל',  csvHeader: 'מזהה ברזל',       parserFieldName: 'iron_UUID',            valueType: 'id'     },
    ironType:        { label: 'סוג ברזל',   csvHeader: 'סוג ברזל',        parserFieldName: 'iron_type',            valueType: 'string' },
    ironVersion:     { label: 'גרסת ברזל',  csvHeader: 'גרסת ברזל',       parserFieldName: 'iron_version',         valueType: 'string' },
    heatConductor:   { label: 'מוליך חום',  csvHeader: 'מוליך חום',       parserFieldName: 'heat_conductor',       valueType: 'string' },
    isStockAshdod:   { label: 'מלאי אשדוד ברזל', csvHeader: 'מלאי אשדוד ברזל', parserFieldName: 'iron_is_stock_ashdod', valueType: 'bool'   },
    notes:           { label: 'הערה',        csvHeader: 'הערה',             parserFieldName: 'notes',                valueType: 'meta'   },
    source:          { label: 'מ"ד',         csvHeader: 'מ"ד',              parserFieldName: 'source',               valueType: 'meta'   },
    sourceTime:      { label: 'תאריך מקור',  csvHeader: 'תאריך מקור',       parserFieldName: 'source_time',          valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const PLASTIC_CONFIG = {
  tableName: 'plastics',
  displayName: 'פלסטיק',
  pluralDisplayName: 'פלסטיקים',
  columns: {
    id:          { label: 'מזהה פלסטיק', csvHeader: 'מזהה פלסטיק', parserFieldName: 'plastic_UUID',  valueType: 'id'     },
    batteryId:   { label: 'מזהה סוללה',  csvHeader: 'מזהה סוללה',  parserFieldName: 'battery_UUID',  valueType: 'fk'     },
    plasticType: { label: 'סוג פלסטיק',  csvHeader: 'סוג פלסטיק',  parserFieldName: 'plastic_type',  valueType: 'string' },
    notes:       { label: 'הערה',         csvHeader: 'הערה',         parserFieldName: 'notes',          valueType: 'meta'   },
    source:      { label: 'מ"ד',          csvHeader: 'מ"ד',          parserFieldName: 'source',         valueType: 'meta'   },
    sourceTime:  { label: 'תאריך מקור',   csvHeader: 'תאריך מקור',   parserFieldName: 'source_time',    valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const ROBOT_CONFIG = {
  tableName: 'robots',
  displayName: 'מכונית',
  pluralDisplayName: 'מכוניות',
  columns: {
    id:              { label: 'מזהה רובוט',    csvHeader: 'מזהה רובוט',           parserFieldName: 'robot_UUID',              valueType: 'id'     },
    cardboardId:     { label: 'מזהה קרטון',    csvHeader: 'מזהה קרטון',           parserFieldName: 'cardboard_UUID',          valueType: 'fk'     },
    sensorId:        { label: 'מזהה חיישן',    csvHeader: 'מזהה חיישן',           parserFieldName: 'sensor_UUID',             valueType: 'fk'     },
    communicationId: { label: 'מזהה תקשורת',   csvHeader: 'מזהה תקשורת',          parserFieldName: 'communication_UUID',      valueType: 'fk'     },
    wiringId:        { label: 'מזהה כבל',      csvHeader: 'מזהה כבל',             parserFieldName: 'wiring_UUID',             valueType: 'fk'     },
    carrier:         { label: 'ספק שילוח',     csvHeader: 'ספק שילוח',            parserFieldName: 'carrier',                 valueType: 'string' },
    district:        { label: 'מחוז רובוט',          csvHeader: 'מחוז רובוט',           parserFieldName: 'robot_district',          valueType: 'string' },
    storeName:       { label: 'שם חנות רובוט',       csvHeader: 'שם חנות רובוט',        parserFieldName: 'robot_store_name',        valueType: 'string' },
    isPurchased:     { label: 'נרכש',                csvHeader: 'נרכש',                 parserFieldName: 'is_purchased',            valueType: 'bool'   },
    isStockAshdod:   { label: 'מלאי אשדוד רובוט',   csvHeader: 'מלאי אשדוד רובוט',    parserFieldName: 'robot_is_stock_ashdod',   valueType: 'bool'   },
    isStockTelAviv:  { label: 'מלאי תל אביב רובוט', csvHeader: 'מלאי תל אביב רובוט',  parserFieldName: 'robot_is_stock_tel_aviv',  valueType: 'bool'   },
    isStockRehovot:  { label: 'מלאי רחובות רובוט',  csvHeader: 'מלאי רחובות רובוט',   parserFieldName: 'robot_is_stock_rehovot',  valueType: 'bool'   },
    isStockNetanya:  { label: 'מלאי נתניה רובוט',   csvHeader: 'מלאי נתניה רובוט',    parserFieldName: 'robot_is_stock_netanya',  valueType: 'bool'   },
    isStockAfula:    { label: 'מלאי עפולה רובוט',   csvHeader: 'מלאי עפולה רובוט',    parserFieldName: 'robot_is_stock_afula',    valueType: 'bool'   },
    notes:           { label: 'הערה',          csvHeader: 'הערה',                 parserFieldName: 'notes',                   valueType: 'meta'   },
    source:          { label: 'מ"ד',           csvHeader: 'מ"ד',                  parserFieldName: 'source',                  valueType: 'meta'   },
    sourceTime:      { label: 'תאריך מקור',    csvHeader: 'תאריך מקור',           parserFieldName: 'source_time',             valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const SENSOR_CONFIG = {
  tableName: 'sensors',
  displayName: 'חיישן',
  pluralDisplayName: 'חיישנים',
  columns: {
    id:            { label: 'מזהה חיישן',  csvHeader: 'מזהה חיישן',  parserFieldName: 'sensor_UUID',    valueType: 'id'     },
    sensorType:    { label: 'סוג חיישן',   csvHeader: 'סוג חיישן',   parserFieldName: 'sensor_type',    valueType: 'string' },
    sensorVersion: { label: 'גרסת חיישן',  csvHeader: 'גרסת חיישן',  parserFieldName: 'sensor_version', valueType: 'string' },
    notes:         { label: 'הערה',         csvHeader: 'הערה',         parserFieldName: 'notes',          valueType: 'meta'   },
    source:        { label: 'מ"ד',          csvHeader: 'מ"ד',          parserFieldName: 'source',         valueType: 'meta'   },
    sourceTime:    { label: 'תאריך מקור',   csvHeader: 'תאריך מקור',   parserFieldName: 'source_time',    valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const STORAGE_CONFIG = {
  tableName: 'storages',
  displayName: 'אחסון',
  pluralDisplayName: 'אחסון',
  columns: {
    id:             { label: 'מזהה אחסון', csvHeader: 'מזהה אחסון',          parserFieldName: 'storage_UUID',             valueType: 'id'     },
    storageType:    { label: 'סוג אחסון',  csvHeader: 'סוג אחסון',           parserFieldName: 'storage_type',             valueType: 'string' },
    storageVersion: { label: 'גרסת אחסון', csvHeader: 'גרסת אחסון',          parserFieldName: 'storage_version',          valueType: 'string' },
    isStockNetanya: { label: 'מלאי נתניה אחסון', csvHeader: 'מלאי נתניה אחסון',   parserFieldName: 'storage_is_stock_netanya', valueType: 'bool'   },
    isStockAfula:   { label: 'מלאי עפולה אחסון', csvHeader: 'מלאי עפולה אחסון',   parserFieldName: 'storage_is_stock_afula',   valueType: 'bool'   },
    notes:          { label: 'הערה',        csvHeader: 'הערה',                parserFieldName: 'notes',                    valueType: 'meta'   },
    source:         { label: 'מ"ד',         csvHeader: 'מ"ד',                 parserFieldName: 'source',                   valueType: 'meta'   },
    sourceTime:     { label: 'תאריך מקור',  csvHeader: 'תאריך מקור',          parserFieldName: 'source_time',              valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const WIRING_CONFIG = {
  tableName: 'wirings',
  displayName: 'חיווט',
  pluralDisplayName: 'חיווטים',
  columns: {
    id:        { label: 'מזהה חיווט', csvHeader: 'מזהה חיווט',     parserFieldName: 'wiring_UUID',       valueType: 'id'     },
    storageId: { label: 'מזהה אחסון', csvHeader: 'מזהה אחסון',     parserFieldName: 'storage_UUID',      valueType: 'fk'     },
    wiringType: { label: 'סוג חיווט', csvHeader: 'סוג חיווט',      parserFieldName: 'wiring_type',       valueType: 'string' },
    district:  { label: 'מחוז חיווט',       csvHeader: 'מחוז חיווט',     parserFieldName: 'wiring_district',   valueType: 'string' },
    storeName: { label: 'שם חנות חיווט',    csvHeader: 'שם חנות חיווט',  parserFieldName: 'wiring_store_name', valueType: 'string' },
    notes:      { label: 'הערה',       csvHeader: 'הערה',            parserFieldName: 'notes',              valueType: 'meta'   },
    source:     { label: 'מ"ד',        csvHeader: 'מ"ד',             parserFieldName: 'source',             valueType: 'meta'   },
    sourceTime: { label: 'תאריך מקור', csvHeader: 'תאריך מקור',      parserFieldName: 'source_time',        valueType: 'meta'   },
  },
} as const satisfies EntityConfig;

export const ENTITY_CONFIGS = {
  batteries:      BATTERY_CONFIG,
  cardboards:     CARDBOARD_CONFIG,
  communications: COMMUNICATION_CONFIG,
  irons:          IRON_CONFIG,
  plastics:       PLASTIC_CONFIG,
  robots:         ROBOT_CONFIG,
  sensors:        SENSOR_CONFIG,
  storages:       STORAGE_CONFIG,
  wirings:        WIRING_CONFIG,
} as const;

export type EntityCatalogConfig = typeof ENTITY_CONFIGS;
