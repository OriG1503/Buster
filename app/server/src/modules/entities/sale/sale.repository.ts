import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { SaleEntity } from './entities/sale.entity';

@Injectable()
export class SaleRepository extends BaseRepository<SaleEntity> {
  public constructor(
    @InjectRepository(SaleEntity)
    repository: Repository<SaleEntity>,
  ) {
    super(repository);
  }
}
