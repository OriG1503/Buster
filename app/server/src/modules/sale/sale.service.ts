import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from './entities/sale.entity';

@Injectable()
export class SaleService {
  public constructor(
    @InjectRepository(SaleEntity)
    private readonly _saleRepository: Repository<SaleEntity>,
  ) {}
}
