import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryModule } from './modules/entities/battery/battery.module';
import { PlasticModule } from './modules/entities/plastic/plastic.module';
import { IronModule } from './modules/entities/iron/iron.module';
import { CommunicationModule } from './modules/entities/communication/communication.module';
import { SensorModule } from './modules/entities/sensor/sensor.module';
import { SaleModule } from './modules/entities/sale/sale.module';
import { CardboardModule } from './modules/entities/cardboard/cardboard.module';
import { RobotModule } from './modules/entities/robot/robot.module';
import { StorageModule } from './modules/entities/storage/storage.module';
import { WiringModule } from './modules/entities/wiring/wiring.module';
import { ConflictModule } from './modules/entities/conflict/conflict.module';
import { FileModule } from './modules/file/file.module';
import { DataProcessorModule } from './modules/data-processor/data-processor.module';
import { TableViewModule } from './modules/table-view/table-view.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: { rejectUnauthorized: false },
    }),
    BatteryModule,
    PlasticModule,
    IronModule,
    CommunicationModule,
    SensorModule,
    SaleModule,
    CardboardModule,
    RobotModule,
    StorageModule,
    WiringModule,
    ConflictModule,
    FileModule,
    DataProcessorModule,
    TableViewModule,
  ],
})
export class AppModule {}
