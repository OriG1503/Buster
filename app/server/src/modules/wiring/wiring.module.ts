import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WiringEntity } from './entities/wiring.entity';
import { WiringService } from './wiring.service';

@Module({
  imports: [TypeOrmModule.forFeature([WiringEntity])],
  providers: [WiringService],
  exports: [WiringService],
})
export class WiringModule {}
