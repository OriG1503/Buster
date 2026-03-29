import { Injectable, Logger } from '@nestjs/common';
import { EntityValue } from '../../../../shared/types/entity-value.type';
import { ValueConflictDetectionResult } from '../types/value-conflict-detection-result.type';

@Injectable()
export class ValueConflictService {
  private readonly _logger = new Logger(ValueConflictService.name);

  /**
   * Compares incoming field values against stored ones and classifies each non-FK field as:
   * - A gap-fill (stored is null → queue for update)
   * - A conflict (values differ → queue for ValueConflictEntity creation)
   * FK fields (ending in 'Id') are excluded from conflict creation — they are handled
   * as relational conflicts by RelationalConflictDetectionService.
   * Returns all queued changes without persisting anything.
   */
  public detectConflicts(
    tableName: string, entityId: string,
    storedRecord: Record<string, EntityValue>,
    storedSources: Record<string, string | null> | null,
    storedNotes: Record<string, string | null> | null,
    storedSourceTimes: Record<string, string | null> | null,
    incomingFields: Record<string, EntityValue>,
    incomingSource: string, conflictCreator: string, incomingNotes: string | null,
    incomingSourceTime: string | null,
  ): ValueConflictDetectionResult {
    const conflictsToCreate: Record<string, EntityValue>[] = [];
    const fieldsToUpdate: Record<string, EntityValue> = {};
    const sourceUpdates: Record<string, string> = {};
    const notesUpdates: Record<string, string | null> = {};
    const sourceTimeUpdates: Record<string, string | null> = {};

    Object.keys(incomingFields).forEach((field) => {
      const incomingValue = incomingFields[field];

      if (incomingValue === null || incomingValue === undefined) {
        return;
      }

      const storedValue = storedRecord[field];

      if (storedValue === null || storedValue === undefined) {
        fieldsToUpdate[field] = incomingValue;
        sourceUpdates[field] = incomingSource;
        notesUpdates[field] = incomingNotes;
        sourceTimeUpdates[field] = incomingSourceTime;
        return;
      }

      if (storedValue !== incomingValue && !field.endsWith('Id')) {
        conflictsToCreate.push({
          tableName, columnName: field, entityId,
          newValue: String(incomingValue as string | number | boolean),
          newSource: incomingSource, newNotes: incomingNotes, newSourceTime: incomingSourceTime,
          oldValue: String(storedValue as string | number | boolean),
          oldSource: storedSources?.[field] ?? null,
          oldNotes: storedNotes?.[field] ?? null,
          oldSourceTime: storedSourceTimes?.[field] ?? null,
          conflictCreator, isSolved: false,
        });
      }
    });

    if (conflictsToCreate.length > 0) {
      this._logger.warn(`${tableName}/${entityId}: ${conflictsToCreate.length} conflict(s) on [${conflictsToCreate.map((c) => c['columnName']).join(', ')}]`);
    }
    if (Object.keys(fieldsToUpdate).length > 0) {
      this._logger.log(`${tableName}/${entityId}: ${Object.keys(fieldsToUpdate).length} gap-fill(s) on [${Object.keys(fieldsToUpdate).join(', ')}]`);
    }

    return { conflictsToCreate, fieldsToUpdate, sourceUpdates, notesUpdates, sourceTimeUpdates };
  }
}
