import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedWiring extends MappedEntityBase {
  wiringType: string | null;
  district: string | null;
  municipality: string | null;
  storageId: string | null;
}
