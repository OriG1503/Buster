import { Module } from '@nestjs/common';
import { BatteryModule } from '../../modules/battery/battery.module';
import { CardboardModule } from '../../modules/cardboard/cardboard.module';
import { CommunicationModule } from '../../modules/communication/communication.module';
import { IronModule } from '../../modules/iron/iron.module';
import { PlasticModule } from '../../modules/plastic/plastic.module';
import { RobotModule } from '../../modules/robot/robot.module';
import { SaleModule } from '../../modules/sale/sale.module';
import { SensorModule } from '../../modules/sensor/sensor.module';
import { StorageModule } from '../../modules/storage/storage.module';
import { WiringModule } from '../../modules/wiring/wiring.module';
import { EntityServiceRegistry } from '../services/entity-service-registry.service';

@Module({
  imports: [BatteryModule, CardboardModule, CommunicationModule, IronModule, PlasticModule, RobotModule, SaleModule, SensorModule, StorageModule, WiringModule],
  providers: [EntityServiceRegistry],
  exports: [EntityServiceRegistry],
})
export class EntityServiceRegistryModule {}
