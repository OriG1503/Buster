import { DeepPartial } from 'typeorm';
import { ConflictEntity } from '../entities/conflict.entity';

export type ConflictDetectionResult = {
  conflictsToCreate: DeepPartial<ConflictEntity>[];
  fieldsToUpdate: Record<string, unknown>;
  sourceUpdates: Record<string, string>;
};
