import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedSensor extends MappedEntityBase {
  sensorType: string | null;
  sensorVersion: string | null;
}
