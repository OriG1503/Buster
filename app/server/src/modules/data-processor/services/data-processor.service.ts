import { Injectable, Logger } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { ParserRowMapper } from '../mappers/parser-row.mapper';
import { ParsedRowEnricher } from './parsed-row-enricher.service';
import { EntityIngestionService } from './entity-ingestion.service';
import { FlyingField } from '../types/flying-field.type';
import { ParsedRow } from '../types/parsed-row.type';
import { ProcessResult } from '../types/process-result.type';
import { MappedEntityBase } from '../types/mapped-entity-base.type';
import { EntityResult } from '../types/entity-result.type';
import { RowResult } from '../types/row-result.type';

@Injectable()
export class DataProcessorService {
  private readonly _logger = new Logger(DataProcessorService.name);

  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _enricher: ParsedRowEnricher,
    private readonly _ingestionService: EntityIngestionService,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  /**
   * Processes parsed rows sequentially to ensure correct conflict detection.
   * Rows in the same file often share entity IDs — parallel processing would cause
   * race conditions where later rows silently lose their data due to unique constraint violations.
   */
  public async process(rows: ParsedRow[], username: string): Promise<ProcessResult> {
    this._logger.log(`Processing ${rows.length} rows sequentially — user: ${username}`);
    const results = await rows.reduce<Promise<RowResult[]>>(
      async (acc, row, i) => {
        const prev = await acc;
        try {
          return [...prev, await this._processRow(row, username, i)];
        } catch (error) {
          this._logger.error(`Row ${i} failed unexpectedly — skipped: ${(error as Error).message}`);
          return [...prev, { conflictCount: 0, conflictIds: [], flyingFields: [], totalFields: 0 }];
        }
      },
      Promise.resolve([]),
    );
    return this._aggregateResults(results);
  }

  private _aggregateResults(results: RowResult[]): ProcessResult {
    const conflictCount = results.reduce((sum, r) => sum + r.conflictCount, 0);
    const conflictIds = results.flatMap((r) => r.conflictIds);
    const flyingFields = results.flatMap((r) => r.flyingFields);
    const totalFields = results.reduce((sum, r) => sum + r.totalFields, 0);
    const flyingFieldCount = flyingFields.reduce((sum, f) => sum + f.redFields.length, 0);
    const uploadPercentage = totalFields > 0 ? Math.round(((totalFields - flyingFieldCount) / totalFields) * 100) : 100;
    this._logger.log(`Processing done — ${uploadPercentage}% uploaded, ${conflictCount} conflicts detected`);
    return { conflictCount, conflictIds, flyingFields, uploadPercentage };
  }

  /** Processes a single parsed row leaf-first. */
  private async _processRow(row: ParsedRow, username: string, rowIndex: number): Promise<RowResult> {
    const enriched = this._enricher.enrich(row);

    // Tracks skipped entity IDs so downstream entities can null out any FK references — prevents FK constraint errors.
    const skippedByTable = new Map<string, Set<string>>();

    const run = async (mapped: MappedEntityBase | null, service: EntityService<{ id: string }>): Promise<EntityResult> => {
      const cleaned = this._nullifySkippedFKs(mapped, skippedByTable);
      const result = await this._ingestionService.processEntity(cleaned, service, username, rowIndex);
      if (result.wasSkipped && cleaned?.id) {
        const ids = skippedByTable.get(service.tableName) ?? new Set<string>();
        ids.add(String(cleaned.id));
        skippedByTable.set(service.tableName, ids);
      }
      return result;
    };

    // Level 1 — independent leaves
    const [batteryResult, storageResult, ironResult, cardboardResult, sensorResult] = await Promise.all([
      run(this._mapper.mapBattery(enriched), this._registry.get('batteries')),
      run(this._mapper.mapStorage(enriched), this._registry.get('storages')),
      run(this._mapper.mapIron(enriched), this._registry.get('irons')),
      run(this._mapper.mapCardboard(enriched), this._registry.get('cardboards')),
      run(this._mapper.mapSensor(enriched), this._registry.get('sensors')),
    ]);

    // Level 2 — Plastic (needs Battery), Wiring (needs Storage)
    const [plasticResult, wiringResult] = await Promise.all([
      run(this._mapper.mapPlastic(enriched), this._registry.get('plastics')),
      run(this._mapper.mapWiring(enriched), this._registry.get('wirings')),
    ]);

    // Level 3 — Communication (needs Plastic + Iron)
    const commResult = await run(this._mapper.mapCommunication(enriched), this._registry.get('communications'));

    // Level 4 — Robot (needs Communication, Wiring, Cardboard, Sensor)
    const robotResult = await run(this._mapper.mapRobot(enriched), this._registry.get('robots'));

    const allResults: EntityResult[] = [batteryResult, storageResult, ironResult, cardboardResult, sensorResult, plasticResult, wiringResult, commResult, robotResult];

    return {
      conflictCount: allResults.reduce((sum, r) => sum + r.count, 0),
      conflictIds: allResults.flatMap((r) => r.conflictIds),
      flyingFields: allResults.filter((r) => r.flyingField !== null).map((r) => r.flyingField as FlyingField),
      totalFields: allResults.reduce((sum, r) => sum + r.totalFields, 0),
    };
  }

  /**
   * Returns a copy of the mapped entity with any FK fields pointing to a skipped entity nulled out.
   * Null propagation cascades: if plastic is skipped, communication's plasticId is nulled, potentially making
   * communication a UUID-only row which is also then skipped.
   */
  private _nullifySkippedFKs(mapped: MappedEntityBase | null, skippedByTable: Map<string, Set<string>>): MappedEntityBase | null {
    if (!mapped || skippedByTable.size === 0) { return mapped; }
    const record = mapped as unknown as Record<string, EntityValue>;
    const cleaned = { ...record };
    Object.keys(cleaned)
      .filter((k) => k.endsWith('Id') && cleaned[k] !== null)
      .forEach((fkField) => {
        const targetTable = FK_FIELD_TO_TABLE[fkField];
        if (targetTable && skippedByTable.get(targetTable)?.has(String(cleaned[fkField]))) {
          cleaned[fkField] = null;
        }
      });
    return cleaned as unknown as MappedEntityBase;
  }
}
