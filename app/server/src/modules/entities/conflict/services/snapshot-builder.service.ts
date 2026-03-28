import { Injectable } from '@nestjs/common';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { ENTITY_CHILDREN_FK_FIELDS } from '../../../../shared/consts/entity-children-fk-fields.const';
import { FK_FIELD_TO_TABLE } from '../../../../shared/consts/fk-field-to-table.const';

@Injectable()
export class SnapshotBuilderService {
  public constructor(private readonly _registry: EntityServiceRegistry) {}

  /**
   * Recursively builds a full subtree snapshot for the given entity.
   * Each node includes all entity fields plus nested child objects keyed by relation name.
   * The snapshot is frozen at call time — later value-conflict resolutions will not affect it.
   */
  public async buildEntitySnapshot(entityId: string, tableName: string): Promise<Record<string, unknown>> {
    const entity = await this._registry.get(tableName).findById(entityId);

    if (!entity) {
      return { id: entityId };
    }

    const entityRecord = entity as unknown as Record<string, unknown>;
    const childFkFields = ENTITY_CHILDREN_FK_FIELDS[tableName] ?? [];

    const childEntries = await Promise.all(
      childFkFields
        .filter((fkField) => entityRecord[fkField] != null)
        .map(async (fkField): Promise<[string, Record<string, unknown>]> => {
          const childTable = FK_FIELD_TO_TABLE[fkField];
          const childId = entityRecord[fkField] as string;
          const childSnapshot = await this.buildEntitySnapshot(childId, childTable);
          const relationKey = fkField.slice(0, -2); // e.g. 'communicationId' → 'communication'
          return [relationKey, childSnapshot];
        }),
    );

    return { ...entityRecord, ...Object.fromEntries(childEntries) };
  }
}
