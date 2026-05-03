import { FieldConfig, EntityInsertData } from '../../../shared/types/entity-config.type';
import { EntityRowBase } from '../types/mapped-entity-base.type';
import { nullIfEmpty, parseBool, parseSourceTime } from './mapper.utils';

type EntityColumnsBase = Record<string, FieldConfig>;

/**
 * Generic mapper: reads CSV fields from raw according to the entity column config and returns a typed insert-data object.
 * FK fields ('fk' valueType) are NOT extracted here — callers must extend the result for FK values derived from nested UUIDs.
 */
export const mapEntityRow = <C extends EntityColumnsBase>(
  columns: C,
  raw: EntityRowBase | null,
): (EntityInsertData<C> & { source: string; notes: string | null; sourceTime: string | null }) | null => {
  if (!raw) {
    return null;
  }
  const rawRecord = raw as unknown as Record<string, string | null>;

  const idEntry = Object.entries(columns).find(([, col]) => col.valueType === 'id');
  const id = idEntry ? nullIfEmpty(rawRecord[idEntry[1].parserFieldName]) : null;
  if (!id) {
    return null;
  }

  const stringData = Object.fromEntries(
    Object.entries(columns)
      .filter(([, col]) => col.valueType === 'string')
      .map(([entityField, col]) => [entityField, nullIfEmpty(rawRecord[col.parserFieldName])]),
  );
  const boolData = Object.fromEntries(
    Object.entries(columns)
      .filter(([, col]) => col.valueType === 'bool')
      .map(([entityField, col]) => [entityField, parseBool(rawRecord[col.parserFieldName])]),
  );

  return {
    id,
    ...stringData,
    ...boolData,
    source: raw.source,
    notes: raw.notes,
    sourceTime: parseSourceTime(rawRecord['source_time']),
  } as unknown as EntityInsertData<C> & { source: string; notes: string | null; sourceTime: string | null };
};
