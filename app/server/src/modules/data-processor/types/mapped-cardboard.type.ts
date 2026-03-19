import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedCardboard extends MappedEntityBase {
  cardboardType: string | null;
  cardboardVersion: string | null;
}
