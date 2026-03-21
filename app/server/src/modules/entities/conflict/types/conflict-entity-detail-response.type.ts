import { RelationalConflictType } from '../consts/relational-conflict-type.const';
import { RelationalConflictSnapshot } from './relational-conflict-snapshot.type';

type ConflictValueEntry = {
  value: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
};

export type RelationalConflictDetail = {
  conflictId: number;
  conflictType: RelationalConflictType;
  oldRelatedId: string;
  newRelatedId: string;
  relatedTable: string;
  oldRelatedSource: string | null;
  newRelatedSource: string | null;
  snapshot: RelationalConflictSnapshot | null;
};

export type ConflictColumnDetail = {
  columnName: string;
  currentValue: string | null;
  currentSource: string | null;
  currentNotes: string | null;
  currentDate: string;
  isConflicted: boolean;
  conflictValues: ConflictValueEntry[];
  relationalConflict?: RelationalConflictDetail;
};

export type ConflictEntityDetailResponse = ConflictColumnDetail[];
