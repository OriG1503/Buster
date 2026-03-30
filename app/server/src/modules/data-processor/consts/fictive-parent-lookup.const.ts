/** Maps a fictive entity's table to the parent table and FK field that references it. */
export const FICTIVE_PARENT_LOOKUP: Record<string, { parentTable: string; fkField: string }> = {
  communications: { parentTable: 'robots', fkField: 'communicationId' },
  plastics: { parentTable: 'communications', fkField: 'plasticId' },
  wirings: { parentTable: 'robots', fkField: 'wiringId' },
};
