import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseConflictRepository } from '../base-conflict.repository';
import { CrossEntityConflictEntity } from './entities/cross-entity-conflict.entity';

@Injectable()
export class CrossEntityConflictRepository extends BaseConflictRepository<CrossEntityConflictEntity> {
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

  /** Soft-deletes all open (isSolved = false) conflicts for a specific robot-field pair. */
  public async softDeleteOpenByRobotField(robotId: string, fieldName: string): Promise<void> {
    const open = await this.findOpenByRobotField(robotId, fieldName);
    await Promise.all(open.map((c) => this.softDelete(c.id)));
  }

  public async resolveByWiringField(wiringId: string, fieldName: string, conflictResolver: string, resolutionNotes: string | null): Promise<void> {
    await this._markResolved({ wiringId, fieldName, isSolved: false } as FindOptionsWhere<CrossEntityConflictEntity>, conflictResolver, resolutionNotes);
  }

  public findSolvedByRobotField(robotId: string, fieldName: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { robotId, fieldName, isSolved: true }, order: { updatedAt: 'ASC' } });
  }

  public findSolvedByWiringField(wiringId: string, fieldName: string): Promise<CrossEntityConflictEntity[]> {
    return this._repository.find({ where: { wiringId, fieldName, isSolved: true }, order: { updatedAt: 'ASC' } });
  }
}
