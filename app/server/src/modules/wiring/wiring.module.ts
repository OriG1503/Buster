import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WiringEntity } from './entities/wiring.entity';
import { WiringService } from './wiring.service';
import { WiringController } from './wiring.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WiringEntity])],
  controllers: [WiringController],
  providers: [WiringService],
  exports: [WiringService],
})
export class WiringModule {}
