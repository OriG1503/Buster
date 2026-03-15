import { Body, Controller, Patch } from '@nestjs/common';
import { BaseEntity } from '../../shared/entities/base.entity';
import { ConflictResolverService } from './conflict-resolver.service';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';

@Controller('conflicts')
export class ConflictController {
  public constructor(private readonly _conflictResolverService: ConflictResolverService) {}

  @Patch('resolve')
  public async resolve(@Body() resolveConflictDto: ResolveConflictDto): Promise<BaseEntity & Record<string, unknown>> {
    return this._conflictResolverService.resolve(resolveConflictDto);
  }
}
