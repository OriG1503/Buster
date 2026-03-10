import { Controller } from '@nestjs/common';
import { ConflictService } from './conflict.service';

@Controller('conflict')
export class ConflictController {
  public constructor(private readonly _conflictService: ConflictService) {}
}
