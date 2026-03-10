import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryEntity } from './entities/battery.entity';
import { BatteryRepository } from './battery.repository';
import { BatteryService } from './battery.service';

@Module({
  imports: [TypeOrmModule.forFeature([BatteryEntity])],
  providers: [BatteryRepository, BatteryService],
  exports: [BatteryRepository, BatteryService],
})
export class BatteryModule {}
