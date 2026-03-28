import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { IronInsertData } from '../../entities/iron/types/iron-insert-data.type';
import { ParsedIronRow } from '../types/parsed-row.type';
import { nullIfEmpty, parseBool } from './mapper.utils';

export const mapIronRow = (raw: ParsedIronRow | null): MappedEntity<IronInsertData> | null => {
  if (!raw) { return null; }
  return {
    id: nullIfEmpty(raw.iron_UUID) as string,
    source: raw.source,
    notes: raw.notes,
    ironType: nullIfEmpty(raw.iron_type),
    ironVersion: nullIfEmpty(raw.iron_version),
    isHeatConductor: parseBool(raw.is_heat_conductor),
    isStockAshdod: parseBool(raw.iron_is_stock_ashdod),
  };
};
