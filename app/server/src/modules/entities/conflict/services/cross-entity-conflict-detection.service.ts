import { Injectable, Logger } from '@nestjs/common';
import { RobotEntity } from '../../robot/entities/robot.entity';
import { WiringEntity } from '../../wiring/entities/wiring.entity';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { CrossEntityConflictRepository } from '../cross-entity-conflict.repository';
import { CROSS_ENTITY_FIELDS, CrossEntityField } from '../consts/cross-entity-fields.const';

type FieldTrackingMap = Record<string, string | null> | null;

@Injectable()
export class CrossEntityConflictDetectionService {
  private readonly _logger = new Logger(CrossEntityConflictDetectionService.name);

  public constructor(
    private readonly _crossEntityConflictRepository: CrossEntityConflictRepository,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  /**
   * Re-detects cross-entity conflicts for a single robot/wiring pair.
   * Called after a robot is inserted or updated (if it has a wiringId).
   */
  public async detectForRobotWiringPair(
    robotId: string,
    wiringId: string,
    conflictCreator: string,
  ): Promise<void> {
    const [robot, wiring] = await Promise.all([
      this._registry.get('robots').findById(robotId),
      this._registry.get('wirings').findById(wiringId),
    ]);

    if (!robot || !wiring) { return; }

    await Promise.all(
      CROSS_ENTITY_FIELDS.map((field) => this._detectForField(robot as unknown as RobotEntity, wiring as unknown as WiringEntity, field, conflictCreator)),
    );
  }

  /**
   * Re-detects cross-entity conflicts for ALL robots attached to a wiring.
   * Called after wiring values change (via upload or conflict resolution).
   */
  public async detectForWiringRobots(wiringId: string, conflictCreator: string): Promise<void> {
    const [wiring, robots] = await Promise.all([
      this._registry.get('wirings').findById(wiringId),
      this._getRobotsByWiringId(wiringId),
    ]);

    if (!wiring || robots.length === 0) { return; }

    await Promise.all(
      robots.flatMap((robot) =>
        CROSS_ENTITY_FIELDS.map((field) =>
          this._detectForField(robot as unknown as RobotEntity, wiring as unknown as WiringEntity, field, conflictCreator),
        ),
      ),
    );
  }

  private async _detectForField(
    robot: RobotEntity,
    wiring: WiringEntity,
    field: CrossEntityField,
    conflictCreator: string,
  ): Promise<void> {
    const robotRecord = robot as unknown as Record<string, unknown>;
    const wiringRecord = wiring as unknown as Record<string, unknown>;

    const robotValue = robotRecord[field] != null ? String(robotRecord[field]) : null;
    const wiringValue = wiringRecord[field] != null ? String(wiringRecord[field]) : null;

    // Soft-delete any existing open conflict for this pair+field before re-evaluating
    await this._crossEntityConflictRepository.softDeleteOpenByRobotField(robot.id, field);

    if (robotValue === null || wiringValue === null || robotValue === wiringValue) { return; }

    const robotSourceMap = (robotRecord['source'] as FieldTrackingMap) ?? {};
    const wiringSourceMap = (wiringRecord['source'] as FieldTrackingMap) ?? {};
    const robotNotesMap = (robotRecord['notes'] as FieldTrackingMap) ?? {};
    const wiringNotesMap = (wiringRecord['notes'] as FieldTrackingMap) ?? {};
    const robotSourceTimeMap = (robotRecord['sourceTime'] as FieldTrackingMap) ?? {};
    const wiringSourceTimeMap = (wiringRecord['sourceTime'] as FieldTrackingMap) ?? {};

    await this._crossEntityConflictRepository.insert({
      wiringId: wiring.id,
      robotId: robot.id,
      fieldName: field,
      wiringValue,
      robotValue,
      wiringSource: wiringSourceMap[field] ?? null,
      robotSource: robotSourceMap[field] ?? null,
      wiringNotes: wiringNotesMap[field] ?? null,
      robotNotes: robotNotesMap[field] ?? null,
      wiringSourceTime: wiringSourceTimeMap[field] ?? null,
      robotSourceTime: robotSourceTimeMap[field] ?? null,
      isSolved: false,
      conflictCreator,
    });

    this._logger.warn(`Cross-entity conflict: robots/${robot.id} ↔ wirings/${wiring.id} on [${field}] — robot="${robotValue}" wiring="${wiringValue}"`);
  }

  private async _getRobotsByWiringId(wiringId: string): Promise<RobotEntity[]> {
    const robotService = this._registry.get('robots') as { findManyByWiringId?: (id: string) => Promise<RobotEntity[]> };
    if (typeof robotService.findManyByWiringId === 'function') {
      return robotService.findManyByWiringId(wiringId);
    }
    return [];
  }
}
