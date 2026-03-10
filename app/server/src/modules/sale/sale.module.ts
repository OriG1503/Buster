import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleEntity } from './entities/sale.entity';
import { SaleService } from './sale.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaleEntity])],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
