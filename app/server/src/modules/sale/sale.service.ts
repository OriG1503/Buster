import { Injectable } from '@nestjs/common';
import { SaleRepository } from './sale.repository';

@Injectable()
export class SaleService {
  public constructor(private readonly _repository: SaleRepository) {}
}
