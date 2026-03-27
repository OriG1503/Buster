import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedBattery extends MappedEntityBase {
  sku: string | null;
  batteryType: string | null;
  batteryVersion: string | null;
  lithiumVersion: string | null;
}
