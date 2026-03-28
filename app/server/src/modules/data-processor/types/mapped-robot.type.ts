import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedRobot extends MappedEntityBase {
  cardboardId: string | null;
  sensorId: string | null;
  communicationId: string | null;
  wiringId: string | null;
  carrier: string | null;
  isPurchased: boolean | null;
  district: string | null;
  storeName: string | null;
}
