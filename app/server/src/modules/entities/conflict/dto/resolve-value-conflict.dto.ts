import { BaseValueConflictDto } from './base-value-conflict.dto';

export type ResolveValueConflictDto = BaseValueConflictDto & {
  winnerValue: string;
  conflictResolver: string;
};
