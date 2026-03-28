import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedWiring extends MappedEntityBase {
  wiringType: string | null;
  district: string | null;
  storeName: string | null;
  storageId: string | null;
}
