import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { ValueConflictRepository } from '../../entities/conflict/value-conflict/value-conflict.repository';
import { RelationalConflictRepository } from '../../entities/conflict/relational-conflict/relational-conflict.repository';

@Injectable()
export class ConflictReattributionService {
  public constructor(
    private readonly _valueConflictRepository: ValueConflictRepository,
    private readonly _relationalConflictRepository: RelationalConflictRepository,
    private readonly _logger: LoggerService,
  ) {}

  /** Re-attributes all open conflict records that reference a fictive entity ID to a real entity ID. */
  public async reattribute(fictiveId: string, realId: string): Promise<void> {
    this._logger.info(
      `ConflictReattributionService.reattribute — moving open conflicts from fictive "${fictiveId}" to real "${realId}"`,
      'app-workflow',
    );
    await Promise.all([
      this._reattributeValueConflicts(fictiveId, realId),
      this._reattributeRelationalConflicts(fictiveId, realId),
    ]);
  }

  private async _reattributeValueConflicts(fictiveId: string, realId: string): Promise<void> {
    await this._valueConflictRepository.reattribute(fictiveId, realId);
  }

  private async _reattributeRelationalConflicts(fictiveId: string, realId: string): Promise<void> {
    await this._relationalConflictRepository.reattribute(fictiveId, realId);
  }
}
