/** Maps each entity table name to its UUID column name as it appears in the CSV. */
export const ENTITY_UUID_COLUMN: Record<string, string> = {
  batteries: 'battery_UUID',
  storages: 'storage_UUID',
  irons: 'iron_UUID',
  plastics: 'plastic_UUID',
  wirings: 'wiring_UUID',
  communications: 'communication_UUID',
  cardboards: 'cardboard_UUID',
  sensors: 'sensor_UUID',
  robots: 'robot_UUID',
};
