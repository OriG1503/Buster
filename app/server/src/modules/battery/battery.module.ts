import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryEntity } from './entities/battery.entity';
import { BatteryService } from './battery.service';

@Module({
  imports: [TypeOrmModule.forFeature([BatteryEntity])],
  providers: [BatteryService],
  exports: [BatteryService],
})
export class BatteryModule {}
