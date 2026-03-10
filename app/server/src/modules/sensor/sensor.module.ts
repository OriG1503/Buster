import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorEntity } from './entities/sensor.entity';
import { SensorService } from './sensor.service';

@Module({
  imports: [TypeOrmModule.forFeature([SensorEntity])],
  providers: [SensorService],
  exports: [SensorService],
})
export class SensorModule {}
