import { FlyingField } from './flying-field.type';

export type ProcessResult = {
  conflictCount: number;
  conflictIds: number[];
  flyingFields: FlyingField[];
  uploadPercentage: number;
};
