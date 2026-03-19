import { ParsedCommunicationRow } from '../types/parsed-row.type';
import { MappedCommunication } from '../types/mapped-communication.type';
import { nullIfEmpty } from './mapper.utils';

export const mapCommunicationRow = (raw: ParsedCommunicationRow | null): MappedCommunication | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.communication_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    communicationType: nullIfEmpty(raw.communication_type),
    plasticId: raw.plastic ? nullIfEmpty(raw.plastic.plastic_UUID) : null,
    ironId: raw.iron ? nullIfEmpty(raw.iron.iron_UUID) : null,
  };
};
