/** Maps each FK field name to the table it points to (child table). */
export const FK_FIELD_TO_TABLE: Record<string, string> = {
  communicationId: 'communications',
  wiringId: 'wirings',
  cardboardId: 'cardboards',
  sensorId: 'sensors',
  saleId: 'sales',
  plasticId: 'plastics',
  ironId: 'irons',
  batteryId: 'batteries',
  storageId: 'storages',
};

/** Maps each table to the FK fields it owns (pointing down the tree). */
export const ENTITY_CHILDREN_FK_FIELDS: Record<string, string[]> = {
  robots: ['communicationId', 'wiringId', 'cardboardId', 'sensorId', 'saleId'],
  communications: ['plasticId', 'ironId'],
  plastics: ['batteryId'],
  wirings: ['storageId'],
  batteries: [],
  storages: [],
  irons: [],
  cardboards: [],
  sensors: [],
  sales: [],
};

/**
 * FK fields that participate in OneToOne relationships.
 * These enforce a unique constraint — a child can only belong to one parent.
 * TWO_FATHERS conflict detection applies to these fields only.
 * wiringId is excluded (ManyToOne — multiple robots may share the same wiring).
 */
export const ONE_TO_ONE_FK_FIELDS = new Set([
  'communicationId',
  'cardboardId',
  'sensorId',
  'saleId',
  'plasticId',
  'ironId',
  'batteryId',
  'storageId',
]);
