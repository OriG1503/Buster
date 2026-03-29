import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { CrossEntityConflictEntity } from './entities/cross-entity-conflict.entity';

@Injectable()
export class CrossEntityConflictRepository extends BaseRepository<CrossEntityConflictEntity, number> {
  public constructor(@InjectRepository(CrossEntityConflictEntity) repository: Repository<CrossEntityConflictEntity>) {
    super(repository);
  }

  public findOpenByRobot(robotId: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { robotId, isSolved: false } });
  }

  public findOpenByWiring(wiringId: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { wiringId, isSolved: false } });
  }

  public findOpenByRobotField(robotId: string, fieldName: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { robotId, fieldName, isSolved: false } });
  }

  public findOpenByWiringField(wiringId: string, fieldName: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { wiringId, fieldName, isSolved: false } });
  }

  /** Soft-deletes all open (isSolved = false) conflicts for a specific robot-field pair. */
  public async softDeleteOpenByRobotField(robotId: string, fieldName: string): Promise<void> {
    const open = await this.findOpenByRobotField(robotId, fieldName);
    await Promise.all(open.map((c) => this.softDelete(c.id)));
  }

  /** Soft-deletes all open (isSolved = false) conflicts for a specific wiring-field pair (all robots). */
  public async softDeleteOpenByWiringField(wiringId: string, fieldName: string): Promise<void> {
    const open = await this.findOpenByWiringField(wiringId, fieldName);
    await Promise.all(open.map((c) => this.softDelete(c.id)));
  }

  public async resolveByRobotField(robotId: string, fieldName: string, conflictResolver: string, resolutionNotes: string | null): Promise<void> {
    await this._repository.update(
      { robotId, fieldName, isSolved: false },
      { isSolved: true, conflictResolver, resolutionNotes },
    );
  }

  public async resolveByWiringField(wiringId: string, fieldName: string, conflictResolver: string, resolutionNotes: string | null): Promise<void> {
    await this._repository.update(
      { wiringId, fieldName, isSolved: false },
      { isSolved: true, conflictResolver, resolutionNotes },
    );
  }

  public findSolvedByRobotField(robotId: string, fieldName: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { robotId, fieldName, isSolved: true }, order: { updatedAt: 'ASC' } });
  }

  public findSolvedByWiringField(wiringId: string, fieldName: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { wiringId, fieldName, isSolved: true }, order: { updatedAt: 'ASC' } });
  }

  public findById(id: number): Promise<CrossEntityConflictEntity | null> {
    return this._repository.findOne({ where: { id } as any });
  }
}
