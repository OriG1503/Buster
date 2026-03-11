import { Injectable } from '@nestjs/common';
import { BaseService } from '../../shared/services/base.service';
import { SaleRepository } from './sale.repository';
import { SaleEntity } from './entities/sale.entity';
import { SaleInsertData } from './types/sale-insert-data.type';

@Injectable()
export class SaleService extends BaseService<SaleEntity, SaleInsertData> {
  public constructor(repository: SaleRepository) {
    super(repository);
  }
}
