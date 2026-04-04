import { Injectable } from '@nestjs/common';
import { FICTIVE_PREFIX } from '../consts/fictive-prefix.const';

@Injectable()
export class FictiveIdService {
  public isFictive(id: string): boolean {
    return id.startsWith(`${FICTIVE_PREFIX}-`);
  }

  public generate(entityType: string, childId: string): string {
    return `${FICTIVE_PREFIX}-${entityType}-${childId}`;
  }
}
