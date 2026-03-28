import { FlyingField } from './flying-field.type';

/** Result of processing a single entity within a parsed row. */
export type EntityResult = {
  count: number;
  conflictIds: number[];
  flyingField: FlyingField | null;
  totalFields: number;
  wasSkipped: boolean;
};
