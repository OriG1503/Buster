export interface EntityRowBase {
  source: string;
  notes: string | null;
}

export interface MappedEntityBase extends EntityRowBase {
  id: string;
}
