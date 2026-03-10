import { Injectable } from '@nestjs/common';
import { WiringRepository } from './wiring.repository';

@Injectable()
export class WiringService {
  public constructor(private readonly _repository: WiringRepository) {}
}
