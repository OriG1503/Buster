import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { CommunicationInsertData } from '../../entities/communication/types/communication-insert-data.type';
import { ParsedCommunicationRow } from '../types/parsed-row.type';
import { nullIfEmpty } from './mapper.utils';

export const mapCommunicationRow = (raw: ParsedCommunicationRow | null): MappedEntity<CommunicationInsertData> | null => {
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
