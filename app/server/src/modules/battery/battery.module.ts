import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryEntity } from './entities/battery.entity';
import { BatteryService } from './battery.service';
import { BatteryController } from './battery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BatteryEntity])],
  controllers: [BatteryController],
  providers: [BatteryService],
  exports: [BatteryService],
})
export class BatteryModule {}
