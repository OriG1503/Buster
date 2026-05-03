import { Injectable } from '@nestjs/common';
import { FK_FIELD_TO_TABLE } from '../../../shared/consts/fk-field-to-table.const';
import { EntityValue } from '../../../shared/types/entity-value.type';
import { EntityService } from '../../../shared/types/entity-service.type';
import { EntityServiceRegistry } from '../../../shared/services/entity-service-registry.service';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { CrossEntityConflictDetectionService } from '../../entities/conflict/cross-entity-conflict/services/cross-entity-conflict-detection.service';
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
  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _enricher: ParsedRowEnricher,
    private readonly _ingestionService: EntityIngestionService,
    private readonly _registry: EntityServiceRegistry,
    private readonly _crossEntityDetectionService: CrossEntityConflictDetectionService,
    private readonly _logger: LoggerService,
  ) {}

  /**
   * Processes parsed rows sequentially to ensure correct conflict detection.
   * Rows in the same file often share entity IDs — parallel processing would cause
   * race conditions where later rows silently lose their data due to unique constraint violations.
   */
  public async process(rows: ParsedRow[], username: string): Promise<ProcessResult> {
    //LOG
    this._logger.info(
      `DataProcessorService.process — starting sequential ingestion of ${rows.length} rows for user "${username}"`,
      'app-workflow',
    );
    const results = await rows.reduce<Promise<RowResult[]>>(async (acc, row, i) => {
      const prev = await acc;
      try {
        //LOG
        this._logger.debug(`DataProcessorService.process — processing row ${i}/${rows.length - 1}`, 'app-workflow');
        return [...prev, await this._processRow(row, username, i)];
      } catch (error) {
        //LOG
        this._logger.error(
          `DataProcessorService.process — row ${i} failed unexpectedly, skipped: ${(error as Error).message}`,
          'app-workflow',
        );
        return [...prev, { conflictCount: 0, conflictIds: [], flyingFields: [], totalFields: 0 }];
      }
    }, Promise.resolve([]));
    return this._aggregateResults(results);
  }

  private _aggregateResults(results: RowResult[]): ProcessResult {
    const conflictCount = results.reduce((sum, r) => sum + r.conflictCount, 0);
    const conflictIds = results.flatMap((r) => r.conflictIds);
    const flyingFields = results.flatMap((r) => r.flyingFields);
    const totalFields = results.reduce((sum, r) => sum + r.totalFields, 0);
    const flyingFieldCount = flyingFields.reduce((sum, f) => sum + f.redFields.length, 0);
    const uploadPercentage = totalFields > 0 ? Math.round(((totalFields - flyingFieldCount) / totalFields) * 100) : 100;
    //LOG
    this._logger.info(
      `DataProcessorService — aggregate result: ${uploadPercentage}% uploaded, ${conflictCount} conflicts, ${flyingFieldCount} flying fields, ${totalFields} fields total`,
      'app-workflow',
    );
    return { conflictCount, conflictIds, flyingFields, uploadPercentage };
  }

  /** Processes a single parsed row leaf-first. */
  private async _processRow(row: ParsedRow, username: string, rowIndex: number): Promise<RowResult> {
    //LOG
    this._logger.debug(
      `DataProcessorService._processRow — enriching row ${rowIndex} (robot_UUID="${row.robot_UUID ?? ''}")`,
      'app-workflow',
    );
    const enriched = await this._enricher.enrich(row);

    // Tracks skipped entity IDs so downstream entities can null out any FK references — prevents FK constraint errors.
    const skippedByTable = new Map<string, Set<string>>();

    const run = async (
      mapped: MappedEntityBase | null,
      service: EntityService<{ id: string }>,
    ): Promise<EntityResult> => {
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
    const mappedWiring = this._mapper.mapWiring(enriched);
    const [plasticResult, wiringResult] = await Promise.all([
      run(this._mapper.mapPlastic(enriched), this._registry.get('plastics')),
      run(mappedWiring, this._registry.get('wirings')),
    ]);

    // Level 3 — Communication (needs Plastic + Iron)
    const commResult = await run(this._mapper.mapCommunication(enriched), this._registry.get('communications'));

    // Level 4 — Robot (needs Communication, Wiring, Cardboard, Sensor)
    const mappedRobot = this._mapper.mapRobot(enriched);
    const robotResult = await run(mappedRobot, this._registry.get('robots'));

    // Cross-entity conflict detection: re-evaluate robot↔wiring alignment after both are processed.
    // If wiring was in this row: re-detect for ALL robots attached to it (catches all impacted robots).
    // Otherwise: if robot references an existing wiring, detect the specific pair.
    const mappedWiringRecord = mappedWiring as unknown as Record<string, unknown> | null;
    const processedWiringId = mappedWiringRecord?.['id'] ? String(mappedWiringRecord['id']) : null;
    const mappedRobotRecord = mappedRobot as unknown as Record<string, unknown> | null;
    const robotId = mappedRobotRecord?.['id'] ? String(mappedRobotRecord['id']) : null;
    const robotWiringId = mappedRobotRecord?.['wiringId'] ? String(mappedRobotRecord['wiringId']) : null;

    if (processedWiringId) {
      //LOG
      this._logger.debug(
        `DataProcessorService._processRow — re-running cross-entity detection for wiring "${processedWiringId}" and its robots`,
        'app-workflow',
      );
      await this._crossEntityDetectionService.detectForWiringRobots(processedWiringId, username).catch((err) => {
        //LOG
        this._logger.warn(
          `DataProcessorService._processRow — cross-entity detection failed for wiring "${processedWiringId}": ${(err as Error).message}`,
          'app-workflow',
        );
      });
    } else if (robotId && robotWiringId) {
      //LOG
      this._logger.debug(
        `DataProcessorService._processRow — re-running cross-entity detection for robot "${robotId}" ↔ wiring "${robotWiringId}"`,
        'app-workflow',
      );
      await this._crossEntityDetectionService
        .detectForRobotWiringPair(robotId, robotWiringId, username)
        .catch((err) => {
          //LOG
          this._logger.warn(
            `DataProcessorService._processRow — cross-entity detection failed for robot "${robotId}": ${(err as Error).message}`,
            'app-workflow',
          );
        });
    }

    const allResults: EntityResult[] = [
      batteryResult,
      storageResult,
      ironResult,
      cardboardResult,
      sensorResult,
      plasticResult,
      wiringResult,
      commResult,
      robotResult,
    ];

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
  private _nullifySkippedFKs(
    mapped: MappedEntityBase | null,
    skippedByTable: Map<string, Set<string>>,
  ): MappedEntityBase | null {
    if (!mapped || skippedByTable.size === 0) {
      return mapped;
    }
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
