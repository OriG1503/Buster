import { MappedEntityBase } from './mapped-entity-base.type';

export interface MappedCommunication extends MappedEntityBase {
  communicationType: string | null;
  plasticId: string | null;
  ironId: string | null;
}
