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
    existing: Record<string, unknown>,
    existingSource: Record<string, string | null> | null,
    incoming: Record<string, unknown>,
    fileSource: string,
  ): ConflictDetectionResult {
    const conflictsToCreate: DeepPartial<ConflictEntity>[] = [];
    const fieldsToUpdate: Record<string, unknown> = {};
    const sourceUpdates: Record<string, string> = {};

    Object.keys(incoming).forEach((field) => {
      const incomingValue = incoming[field];

      if (incomingValue === null || incomingValue === undefined) {
        return;
      }

      const existingValue = existing[field];

      if (existingValue === null || existingValue === undefined) {
        fieldsToUpdate[field] = incomingValue;
        sourceUpdates[field] = fileSource;
        return;
      }

      if (existingValue !== incomingValue) {
        conflictsToCreate.push({
          tableName,
          columnName: field,
          entityId,
          newValue: String(incomingValue as string | number | boolean),
          newSource: fileSource,
          oldValue: String(existingValue as string | number | boolean),
          oldSource: existingSource?.[field] ?? null,
          isSolved: false,
        });
      }
    });

    return { conflictsToCreate, fieldsToUpdate, sourceUpdates };
  }
}
