import { ParsedRow } from '../types/parsed-row.type';
import { MappedSensor } from '../types/mapped-sensor.type';
import { nullIfEmpty } from './mapper.utils';

export const mapSensorRow = (row: ParsedRow): MappedSensor | null => {
  const raw = row.sensor;
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.sensor_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    sensorType: nullIfEmpty(raw.sensor_type),
    sensorVersion: nullIfEmpty(raw.sensor_version),
  };
};
