export type JoinDef = {
  parentTable: string;
  fkColumn: string;
};

/**
 * Maps each joinable table to the table + FK column that owns the relationship.
 * Captures the full entity graph (Robot as the natural root):
 *
 *   Robot ──→ Cardboard
 *                 ├──→ Sensor
 *                 ├──→ Communication ──→ Plastic ──→ Battery
 *                 │                  └──→ Iron
 *                 └──→ Wiring ──→ Storage
 */
export const PARENT_JOIN: Record<string, JoinDef> = {
  sensors: { parentTable: 'robots', fkColumn: 'sensorId' },
  cardboards: { parentTable: 'robots', fkColumn: 'cardboardId' },
  communications: { parentTable: 'robots', fkColumn: 'communicationId' },
  wirings: { parentTable: 'robots', fkColumn: 'wiringId' },
  plastics: { parentTable: 'communications', fkColumn: 'plasticId' },
  irons: { parentTable: 'communications', fkColumn: 'ironId' },
  batteries: { parentTable: 'plastics', fkColumn: 'batteryId' },
  storages: { parentTable: 'wirings', fkColumn: 'storageId' },
};

/**
 * Topological join order (ancestors before descendants).
 * Every table listed here can be LEFT JOIN-ed once its parent is in the FROM clause.
 */
export const JOIN_ORDER: string[] = [
  'sensors',
  'cardboards',
  'communications',
  'wirings',
  'plastics',
  'irons',
  'batteries',
  'storages',
];
