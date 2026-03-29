import { EntityValue } from '../../../../shared/types/entity-value.type';

export type ValueConflictDetectionResult = {
  conflictsToCreate: Record<string, EntityValue>[];
  fieldsToUpdate: Record<string, EntityValue>;
  sourceUpdates: Record<string, string>;
  notesUpdates: Record<string, string | null>;
  sourceTimeUpdates: Record<string, string | null>;
};
