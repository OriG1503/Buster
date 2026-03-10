import { Controller } from '@nestjs/common';
import { SaleService } from './sale.service';

@Controller('sale')
export class SaleController {
  public constructor(private readonly _saleService: SaleService) {}
}
