import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorEntity } from './entities/sensor.entity';
import { SensorRepository } from './sensor.repository';
import { SensorService } from './sensor.service';

@Module({
  imports: [TypeOrmModule.forFeature([SensorEntity])],
  providers: [SensorRepository, SensorService],
  exports: [SensorRepository, SensorService],
})
export class SensorModule {}
