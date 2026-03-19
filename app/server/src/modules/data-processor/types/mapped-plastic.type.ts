import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedPlastic extends MappedEntityBase {
  plasticType: string | null;
  batteryId: string | null;
}
