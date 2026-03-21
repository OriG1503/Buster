import { BaseValueConflictDto } from './base-value-conflict.dto';

export type RevertValueConflictDto = BaseValueConflictDto & {
  revertValue: string;
  revertedBy: string;
};
