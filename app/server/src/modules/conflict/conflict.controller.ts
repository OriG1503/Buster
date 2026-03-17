import { Body, Controller, Patch } from '@nestjs/common';
import { BaseEntity } from '../../shared/entities/base.entity';
import { ConflictResolverService } from './conflict-resolver.service';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { RevertService } from './revert.service';
import { RevertConflictDto } from './dto/revert-conflict.dto';

@Controller('conflicts')
export class ConflictController {
  public constructor(
    private readonly _conflictResolverService: ConflictResolverService,
    private readonly _revertService: RevertService,
  ) {}

  @Patch('resolve')
  public async resolve(@Body() resolveConflictDto: ResolveConflictDto): Promise<BaseEntity> {
    return this._conflictResolverService.resolve(resolveConflictDto);
  }

  @Patch('revert')
  public async revert(@Body() revertConflictDto: RevertConflictDto): Promise<BaseEntity> {
    return this._revertService.revert(revertConflictDto);
  }
}
