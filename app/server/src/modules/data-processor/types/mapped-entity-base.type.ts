export type EntityRowBase = {
  source: string;
  notes: string | null;
};

export type MappedEntityBase = EntityRowBase & { id: string };
