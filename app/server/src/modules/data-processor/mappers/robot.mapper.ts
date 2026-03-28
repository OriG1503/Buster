import { ParsedRow } from '../types/parsed-row.type';
import { MappedRobot } from '../types/mapped-robot.type';
import { nullIfEmpty, parseBool } from './mapper.utils';

export const mapRobotRow = (row: ParsedRow): MappedRobot | null => {
  const id = nullIfEmpty(row.robot_UUID);
  if (!id) { return null; }
  return {
    id,
    source: row.source,
    notes: row.notes,
    cardboardId: row.cardboard ? nullIfEmpty(row.cardboard.cardboard_UUID) : null,
    sensorId: row.sensor ? nullIfEmpty(row.sensor.sensor_UUID) : null,
    communicationId: row.communication ? nullIfEmpty(row.communication.communication_UUID) : null,
    wiringId: row.wiring ? nullIfEmpty(row.wiring.wiring_UUID) : null,
    carrier: nullIfEmpty(row.carrier),
    isPurchased: parseBool(row.is_purchased),
    district: nullIfEmpty(row.robot_district),
    storeName: nullIfEmpty(row.robot_store_name),
  };
};
