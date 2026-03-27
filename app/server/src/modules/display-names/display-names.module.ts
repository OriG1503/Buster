import { Module } from '@nestjs/common';
import { DisplayNamesController } from './display-names.controller';
import { DisplayNamesService } from './display-names.service';

@Module({
  controllers: [DisplayNamesController],
  providers: [DisplayNamesService],
  exports: [DisplayNamesService],
})
export class DisplayNamesModule {}
