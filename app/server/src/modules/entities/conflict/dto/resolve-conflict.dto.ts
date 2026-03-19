import { BaseConflictDto } from './base-conflict.dto';

export interface ResolveConflictDto extends BaseConflictDto {
  winnerValue: string;
  conflictResolver: string;
}
