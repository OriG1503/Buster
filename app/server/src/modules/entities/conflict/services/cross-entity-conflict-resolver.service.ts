import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityServiceRegistry } from '../../../../shared/services/entity-service-registry.service';
import { CrossEntityConflictRepository } from '../cross-entity-conflict.repository';
import { CrossEntityConflictDetectionService } from './cross-entity-conflict-detection.service';
import { ResolveCrossEntityConflictDto } from '../dto/resolve-cross-entity-conflict.dto';
import { RevertCrossEntityConflictDto } from '../dto/revert-cross-entity-conflict.dto';
import { ValueConflictRepository } from '../value-conflict.repository';

@Injectable()
export class CrossEntityConflictResolverService {
  private readonly _logger = new Logger(CrossEntityConflictResolverService.name);

  public constructor(
    private readonly _crossEntityConflictRepository: CrossEntityConflictRepository,
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _detectionService: CrossEntityConflictDetectionService,
    private readonly _registry: EntityServiceRegistry,
  ) {}

  public async resolve(dto: ResolveCrossEntityConflictDto): Promise<void> {
    const { conflictId, winnerValue, conflictResolver, resolutionNotes, applyToRobot } = dto;

    const conflict = await this._crossEntityConflictRepository.findById(conflictId);
    if (!conflict || conflict.isSolved) {
      throw new NotFoundException(`Cross-entity conflict not found or already solved: ${conflictId}`);
    }

    const validValues = new Set([conflict.wiringValue, conflict.robotValue].filter((v): v is string => v !== null));
    if (!validValues.has(winnerValue)) {
      throw new BadRequestException('winnerValue must be one of the competing values');
    }

    const { wiringId, robotId, fieldName } = conflict;
    this._logger.log(`Resolving cross-entity conflict ${conflictId}: ${fieldName} → "${winnerValue}" by ${conflictResolver} (applyToRobot=${applyToRobot})`);

    const isRobotWinner = winnerValue === conflict.robotValue;
    const winnerSource = isRobotWinner ? conflict.robotSource : conflict.wiringSource;
    const winnerNotes = isRobotWinner ? conflict.robotNotes : conflict.wiringNotes;

    if (applyToRobot) {
      await this._applyToRobot(robotId, fieldName, winnerValue, winnerSource, winnerNotes);
    }

    await this._applyToWiring(wiringId, fieldName, winnerValue, winnerSource, winnerNotes);

    // Close all open cross-entity conflicts for this (wiringId, fieldName)
    await this._crossEntityConflictRepository.resolveByWiringField(wiringId, fieldName, conflictResolver, resolutionNotes ?? null);

    // Close any open value conflicts on the same field for both entities
    if (applyToRobot) {
      await this._valueConflictRepository.resolveMany('robots', robotId, fieldName, conflictResolver, resolutionNotes ?? null);
    }
    await this._valueConflictRepository.resolveMany('wirings', wiringId, fieldName, conflictResolver, resolutionNotes ?? null);

    // Re-detect: after applying winner, rebuild cross-entity conflicts for wiring's robots
    await this._detectionService.detectForWiringRobots(wiringId, conflictResolver);
  }

  private async _applyToRobot(robotId: string, fieldName: string, value: string, source: string | null, notes: string | null, sourceTime: string | null = null): Promise<void> {
    const robotService = this._registry.get('robots');
    const robot = await robotService.findById(robotId);
    if (!robot) { return; }
    await robotService.update(
      robotId,
      { [fieldName]: value },
      { [fieldName]: source ?? '' },
      robot.source,
      { [fieldName]: notes },
      robot.notes,
      { [fieldName]: sourceTime },
      robot.sourceTime,
    );
  }

  public async revert(dto: RevertCrossEntityConflictDto): Promise<void> {
    const { tableName, entityId, columnName, revertValue, revertedBy, resolutionNotes } = dto;
    const isRobot = tableName === 'robots';

    const solvedConflicts = isRobot
      ? await this._crossEntityConflictRepository.findSolvedByRobotField(entityId, columnName)
      : await this._crossEntityConflictRepository.findSolvedByWiringField(entityId, columnName);

    if (solvedConflicts.length === 0) {
      throw new NotFoundException(`No resolved cross-entity conflict found for ${tableName}/${entityId}/${columnName}`);
    }

    const matchingConflict = solvedConflicts.find((c) => c.robotValue === revertValue || c.wiringValue === revertValue);
    const revertSource = matchingConflict
      ? (matchingConflict.robotValue === revertValue ? matchingConflict.robotSource : matchingConflict.wiringSource)
      : null;
    const revertNotes = matchingConflict
      ? (matchingConflict.robotValue === revertValue ? matchingConflict.robotNotes : matchingConflict.wiringNotes)
      : null;
    const revertSourceTime = matchingConflict
      ? (matchingConflict.robotValue === revertValue ? matchingConflict.robotSourceTime : matchingConflict.wiringSourceTime)
      : null;

    const lastConflict = solvedConflicts[solvedConflicts.length - 1];
    const cascadedNotes = [lastConflict.resolutionNotes, resolutionNotes].filter(Boolean).join('\n');

    let wiringId: string;
    let robotId: string;

    if (isRobot) {
      robotId = entityId;
      const robot = await this._registry.get('robots').findById(robotId);
      wiringId = (robot as unknown as Record<string, string>)?.['wiringId'];
      if (!wiringId) { throw new BadRequestException(`Robot ${robotId} has no associated wiring`); }
    } else {
      wiringId = entityId;
      robotId = lastConflict.robotId;
    }

    this._logger.log(`Reverting cross-entity ${columnName} for ${tableName}/${entityId} → "${revertValue}" by ${revertedBy}`);

    if (isRobot) {
      await this._applyToRobot(robotId, columnName, revertValue, revertSource, revertNotes, revertSourceTime);
    }
    await this._applyToWiring(wiringId, columnName, revertValue, revertSource, revertNotes, revertSourceTime);

    await this._crossEntityConflictRepository.resolveByWiringField(wiringId, columnName, revertedBy, cascadedNotes);

    if (isRobot) {
      await this._valueConflictRepository.resolveMany('robots', robotId, columnName, revertedBy, cascadedNotes);
    }
    await this._valueConflictRepository.resolveMany('wirings', wiringId, columnName, revertedBy, cascadedNotes);

    await this._detectionService.detectForWiringRobots(wiringId, revertedBy);
  }

  private async _applyToWiring(wiringId: string, fieldName: string, value: string, source: string | null, notes: string | null, sourceTime: string | null = null): Promise<void> {
    const wiringService = this._registry.get('wirings');
    const wiring = await wiringService.findById(wiringId);
    if (!wiring) { return; }
    await wiringService.update(
      wiringId,
      { [fieldName]: value },
      { [fieldName]: source ?? '' },
      wiring.source,
      { [fieldName]: notes },
      wiring.notes,
      { [fieldName]: sourceTime },
      wiring.sourceTime,
    );
  }
}
