import { FlyingField } from './flying-field.type';

export type ProcessResult = {
  conflictCount: number;
  flyingFields: FlyingField[];
  uploadPercentage: number;
};
