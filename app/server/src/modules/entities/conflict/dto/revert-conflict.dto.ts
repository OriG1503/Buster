import { BaseConflictDto } from './base-conflict.dto';

export interface RevertConflictDto extends BaseConflictDto {
  revertValue: string;
  revertedBy: string;
}
