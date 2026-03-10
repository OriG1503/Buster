import { Controller } from '@nestjs/common';
import { CommunicationService } from './communication.service';

@Controller('communication')
export class CommunicationController {
  public constructor(private readonly _communicationService: CommunicationService) {}
}
