/** Maps each table to the FK fields it owns (pointing down the entity tree). */
export const ENTITY_CHILDREN_FK_FIELDS: Record<string, string[]> = {
  robots: ['communicationId', 'wiringId', 'cardboardId', 'sensorId'],
  communications: ['plasticId', 'ironId'],
  plastics: ['batteryId'],
  wirings: ['storageId'],
  batteries: [],
  storages: [],
  irons: [],
  cardboards: [],
  sensors: [],
};
