import { Injectable } from '@nestjs/common';
import { PlasticRepository } from './plastic.repository';

@Injectable()
export class PlasticService {
  public constructor(private readonly _repository: PlasticRepository) {}
}
