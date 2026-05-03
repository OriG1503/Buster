import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityServiceRegistry } from '../../../../../shared/services/entity-service-registry.service';
import { LoggerService } from '../../../../../shared/services/logger/logger.service';
import { CrossEntityConflictRepository } from '../cross-entity-conflict.repository';
import { CrossEntityConflictDetectionService } from './cross-entity-conflict-detection.service';
import { ValueConflictRepository } from '../../value-conflict/value-conflict.repository';
import { ResolveCrossEntityConflictDto } from '../dto/resolve-cross-entity-conflict.dto';
import { RevertCrossEntityConflictDto } from '../dto/revert-cross-entity-conflict.dto';

@Injectable()
export class CrossEntityConflictResolverService {
  public constructor(
    private readonly _crossEntityConflictRepository: CrossEntityConflictRepository,
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _detectionService: CrossEntityConflictDetectionService,
    private readonly _registry: EntityServiceRegistry,
    private readonly _logger: LoggerService,
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
    this._logger.info(
      `CrossEntityConflictResolverService.resolve — conflict ${conflictId}: field "${fieldName}" → winner "${winnerValue}" by "${conflictResolver}" (applyToRobot=${applyToRobot}, robot="${robotId}", wiring="${wiringId}")`,
      'app-workflow',
    );

    const isRobotWinner = winnerValue === conflict.robotValue;
    const winnerSource = isRobotWinner ? conflict.robotSource : conflict.wiringSource;
    const winnerNotes = isRobotWinner ? conflict.robotNotes : conflict.wiringNotes;

    if (applyToRobot) {
      await this._applyToEntity('robots', robotId, fieldName, winnerValue, winnerSource, winnerNotes);
    }

    await this._applyToEntity('wirings', wiringId, fieldName, winnerValue, winnerSource, winnerNotes);

    await this._crossEntityConflictRepository.resolveByWiringField(
      wiringId,
      fieldName,
      conflictResolver,
      resolutionNotes ?? null,
    );

    if (applyToRobot) {
      await this._valueConflictRepository.resolveMany(
        'robots',
        robotId,
        fieldName,
        conflictResolver,
        resolutionNotes ?? null,
      );
    }
    await this._valueConflictRepository.resolveMany(
      'wirings',
      wiringId,
      fieldName,
      conflictResolver,
      resolutionNotes ?? null,
    );

    await this._detectionService.detectForWiringRobots(wiringId, conflictResolver);
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
      ? matchingConflict.robotValue === revertValue
        ? matchingConflict.robotSource
        : matchingConflict.wiringSource
      : null;
    const revertNotes = matchingConflict
      ? matchingConflict.robotValue === revertValue
        ? matchingConflict.robotNotes
        : matchingConflict.wiringNotes
      : null;
    const revertSourceTime = matchingConflict
      ? matchingConflict.robotValue === revertValue
        ? matchingConflict.robotSourceTime
        : matchingConflict.wiringSourceTime
      : null;

    const lastConflict = solvedConflicts[solvedConflicts.length - 1];
    const cascadedNotes = [lastConflict.resolutionNotes, resolutionNotes].filter(Boolean).join('\n');

    let wiringId: string;
    let robotId: string;

    if (isRobot) {
      robotId = entityId;
      const robot = await this._registry.get('robots').findById(robotId);
      wiringId = (robot as unknown as Record<string, string>)?.['wiringId'];
      if (!wiringId) {
        throw new BadRequestException(`Robot ${robotId} has no associated wiring`);
      }
    } else {
      wiringId = entityId;
      robotId = lastConflict.robotId;
    }

    this._logger.info(
      `CrossEntityConflictResolverService.revert — "${tableName}/${entityId}/${columnName}" → revert to "${revertValue}" by "${revertedBy}" (robot="${robotId}", wiring="${wiringId}")`,
      'app-workflow',
    );

    if (isRobot) {
      await this._applyToEntity(
        'robots',
        robotId,
        columnName,
        revertValue,
        revertSource,
        revertNotes,
        revertSourceTime,
      );
    }
    await this._applyToEntity(
      'wirings',
      wiringId,
      columnName,
      revertValue,
      revertSource,
      revertNotes,
      revertSourceTime,
    );

    await this._crossEntityConflictRepository.resolveByWiringField(wiringId, columnName, revertedBy, cascadedNotes);

    if (isRobot) {
      await this._valueConflictRepository.resolveMany('robots', robotId, columnName, revertedBy, cascadedNotes);
    }
    await this._valueConflictRepository.resolveMany('wirings', wiringId, columnName, revertedBy, cascadedNotes);

    await this._detectionService.detectForWiringRobots(wiringId, revertedBy);
  }

  private async _applyToEntity(
    tableName: string,
    entityId: string,
    fieldName: string,
    value: string,
    source: string | null,
    notes: string | null,
    sourceTime: string | null = null,
  ): Promise<void> {
    const service = this._registry.get(tableName);
    const entity = await service.findById(entityId);
    if (!entity) {
      return;
    }
    await service.update(
      entityId,
      { [fieldName]: value },
      { [fieldName]: source ?? '' },
      entity.source,
      { [fieldName]: notes },
      entity.notes,
      { [fieldName]: sourceTime },
      entity.sourceTime,
    );
  }
}
