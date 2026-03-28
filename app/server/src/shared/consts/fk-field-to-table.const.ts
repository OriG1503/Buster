/** Maps each FK field name to the child table it points to. */
export const FK_FIELD_TO_TABLE: Record<string, string> = {
  communicationId: 'communications',
  wiringId: 'wirings',
  cardboardId: 'cardboards',
  sensorId: 'sensors',
  plasticId: 'plastics',
  ironId: 'irons',
  batteryId: 'batteries',
  storageId: 'storages',
};
