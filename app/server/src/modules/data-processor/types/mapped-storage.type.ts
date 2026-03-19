import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedStorage extends MappedEntityBase {
  storageType: string | null;
  storageVersion: string | null;
  isStockNetanya: boolean | null;
  isStockAfula: boolean | null;
}
