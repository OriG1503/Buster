import { Controller } from '@nestjs/common';
import { CardboardService } from './cardboard.service';

@Controller('cardboard')
export class CardboardController {
  public constructor(private readonly _cardboardService: CardboardService) {}
}
