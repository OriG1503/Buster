export type EntityRowBase = {
  source: string;
  notes: string | null;
  sourceTime: string | null;
};

export type MappedEntityBase = EntityRowBase & { id: string };
