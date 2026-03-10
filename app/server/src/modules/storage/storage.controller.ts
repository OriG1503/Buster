import { Controller } from '@nestjs/common';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  public constructor(private readonly _storageService: StorageService) {}
}
