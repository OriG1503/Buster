import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryModule } from './modules/battery/battery.module';
import { PlasticModule } from './modules/plastic/plastic.module';
import { IronModule } from './modules/iron/iron.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { SensorModule } from './modules/sensor/sensor.module';
import { SaleModule } from './modules/sale/sale.module';
import { CardboardModule } from './modules/cardboard/cardboard.module';
import { RobotModule } from './modules/robot/robot.module';
import { StorageModule } from './modules/storage/storage.module';
import { WiringModule } from './modules/wiring/wiring.module';
import { ConflictModule } from './modules/conflict/conflict.module';
import { FileModule } from './modules/file/file.module';
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
  ],
})
export class AppModule {}
