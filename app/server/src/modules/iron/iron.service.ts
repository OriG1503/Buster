import { Injectable } from '@nestjs/common';
import { IronRepository } from './iron.repository';

@Injectable()
export class IronService {
  public constructor(private readonly _repository: IronRepository) {}
}
