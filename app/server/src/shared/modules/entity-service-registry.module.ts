import { Module } from '@nestjs/common';
import { BatteryModule } from '../../modules/entities/battery/battery.module';
import { CardboardModule } from '../../modules/entities/cardboard/cardboard.module';
import { CommunicationModule } from '../../modules/entities/communication/communication.module';
import { IronModule } from '../../modules/entities/iron/iron.module';
import { PlasticModule } from '../../modules/entities/plastic/plastic.module';
import { RobotModule } from '../../modules/entities/robot/robot.module';
import { SaleModule } from '../../modules/entities/sale/sale.module';
import { SensorModule } from '../../modules/entities/sensor/sensor.module';
import { StorageModule } from '../../modules/entities/storage/storage.module';
import { WiringModule } from '../../modules/entities/wiring/wiring.module';
import { EntityServiceRegistry } from '../services/entity-service-registry.service';

@Module({
  imports: [BatteryModule, CardboardModule, CommunicationModule, IronModule, PlasticModule, RobotModule, SaleModule, SensorModule, StorageModule, WiringModule],
  providers: [EntityServiceRegistry],
  exports: [EntityServiceRegistry],
})
export class EntityServiceRegistryModule {}
