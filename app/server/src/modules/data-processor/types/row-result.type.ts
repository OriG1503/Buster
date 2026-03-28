import { FlyingField } from './flying-field.type';

/** Aggregated result of processing all entities in a single parsed row. */
export type RowResult = {
  conflictCount: number;
  conflictIds: number[];
  flyingFields: FlyingField[];
  totalFields: number;
};
