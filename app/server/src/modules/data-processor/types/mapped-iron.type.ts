import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedIron extends MappedEntityBase {
  ironType: string | null;
  ironVersion: string | null;
  isHeatConductor: boolean | null;
}
