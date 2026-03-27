import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WiringEntity } from './entities/wiring.entity';
import { WiringRepository } from './wiring.repository';
import { WiringService } from './wiring.service';

@Module({
  imports: [TypeOrmModule.forFeature([WiringEntity])],
  providers: [WiringRepository, WiringService],
  exports: [WiringRepository, WiringService],
})
export class WiringModule {}
