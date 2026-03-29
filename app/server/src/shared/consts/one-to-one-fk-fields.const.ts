/**
 * FK fields that participate in OneToOne relationships.
 * A child with a OneToOne FK can only belong to one parent — TWO_FATHERS conflict detection applies to these.
 * wiringId is excluded because Wiring is ManyToOne (multiple robots may share the same wiring).
 */
export const ONE_TO_ONE_FK_FIELDS = new Set([
  'communicationId',
  'cardboardId',
  'sensorId',
  'plasticId',
  'ironId',
  'batteryId',
  'storageId',
]);
