export const FK_TO_ENTITY_ID: Record<string, string> = {
  // FK key → linked entity id
  'robots.cardboardId': 'cardboards.id',
  'robots.sensorId': 'sensors.id',
  'robots.communicationId': 'communications.id',
  'robots.saleId': 'sales.id',
  'robots.wiringId': 'wirings.id',
  'wirings.storageId': 'storages.id',
  'communications.plasticId': 'plastics.id',
  'communications.ironId': 'irons.id',
  'plastics.batteryId': 'batteries.id',
  // entity id → linked FK key
  'cardboards.id': 'robots.cardboardId',
  'sensors.id': 'robots.sensorId',
  'communications.id': 'robots.communicationId',
  'sales.id': 'robots.saleId',
  'wirings.id': 'robots.wiringId',
  'storages.id': 'wirings.storageId',
  'plastics.id': 'communications.plasticId',
  'irons.id': 'communications.ironId',
  'batteries.id': 'plastics.batteryId',
};
