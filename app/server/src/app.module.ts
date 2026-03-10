import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        ssl: { rejectUnauthorized: false },
      }),
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
  ],
})
export class AppModule {}
