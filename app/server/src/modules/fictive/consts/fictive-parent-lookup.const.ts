import { FictiveParentInfo } from '../types/fictive-parent-info.type';

/** Maps a fictive entity's table to the parent table and FK field that references it. */
export const FICTIVE_PARENT_LOOKUP: Record<string, FictiveParentInfo> = {
  communications: { parentTable: 'robots', fkField: 'communicationId' },
  plastics: { parentTable: 'communications', fkField: 'plasticId' },
  wirings: { parentTable: 'robots', fkField: 'wiringId' },
};
