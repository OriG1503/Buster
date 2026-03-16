import { Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { ConflictRepository } from './conflict.repository';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictDetectionResult } from './types/conflict-detection-result.type';

@Injectable()
export class ConflictService {
  public constructor(private readonly _repository: ConflictRepository) {}

  public detectConflicts(
    tableName: string,
    entityId: string,
    storedRecord: Record<string, unknown>,
    storedSources: Record<string, string | null> | null,
    storedNotes: Record<string, string | null> | null,
    incomingFields: Record<string, unknown>,
    incomingSource: string,
    conflictCreator: string,
    incomingNotes: string | null,
  ): ConflictDetectionResult {
    const conflictsToCreate: DeepPartial<ConflictEntity>[] = [];
    const fieldsToUpdate: Record<string, unknown> = {};
    const sourceUpdates: Record<string, string> = {};
    const notesUpdates: Record<string, string | null> = {};

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
        return;
      }

      if (storedValue !== incomingValue) {
        conflictsToCreate.push({
          tableName,
          columnName: field,
          entityId,
          newValue: String(incomingValue as string | number | boolean),
          newSource: incomingSource,
          newNotes: incomingNotes,
          oldValue: String(storedValue as string | number | boolean),
          oldSource: storedSources?.[field] ?? null,
          oldNotes: storedNotes?.[field] ?? null,
          conflictCreator,
          isSolved: false,
        });
      }
    });

    return { conflictsToCreate, fieldsToUpdate, sourceUpdates, notesUpdates };
  }
}
