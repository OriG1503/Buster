import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleEntity } from './entities/sale.entity';
import { SaleRepository } from './sale.repository';
import { SaleService } from './sale.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaleEntity])],
  providers: [SaleRepository, SaleService],
  exports: [SaleRepository, SaleService],
})
export class SaleModule {}
