import { Module } from '@nestjs/common';
import { BatteryModule } from '../battery/battery.module';
import { StorageModule } from '../storage/storage.module';
import { IronModule } from '../iron/iron.module';
import { PlasticModule } from '../plastic/plastic.module';
import { WiringModule } from '../wiring/wiring.module';
import { CommunicationModule } from '../communication/communication.module';
import { CardboardModule } from '../cardboard/cardboard.module';
import { SensorModule } from '../sensor/sensor.module';
import { SaleModule } from '../sale/sale.module';
import { RobotModule } from '../robot/robot.module';
import { ConflictModule } from '../conflict/conflict.module';
import { DataProcessorService } from './data-processor.service';
import { ParserRowMapper } from './mappers/parser-row.mapper';

@Module({
  imports: [
    BatteryModule,
    StorageModule,
    IronModule,
    PlasticModule,
    WiringModule,
    CommunicationModule,
    CardboardModule,
    SensorModule,
    SaleModule,
    RobotModule,
    ConflictModule,
  ],
  providers: [DataProcessorService, ParserRowMapper],
  exports: [DataProcessorService],
})
export class DataProcessorModule {}
