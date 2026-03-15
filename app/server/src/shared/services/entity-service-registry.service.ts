import { Injectable } from '@nestjs/common';
import { BatteryService } from '../../modules/battery/battery.service';
import { CardboardService } from '../../modules/cardboard/cardboard.service';
import { CommunicationService } from '../../modules/communication/communication.service';
import { IronService } from '../../modules/iron/iron.service';
import { PlasticService } from '../../modules/plastic/plastic.service';
import { RobotService } from '../../modules/robot/robot.service';
import { SaleService } from '../../modules/sale/sale.service';
import { SensorService } from '../../modules/sensor/sensor.service';
import { StorageService } from '../../modules/storage/storage.service';
import { WiringService } from '../../modules/wiring/wiring.service';
import { EntityService } from '../../modules/data-processor/types/entity-service.type';

@Injectable()
export class EntityServiceRegistry {
  private readonly _map: Record<string, EntityService<{ id: string }>>;

  public constructor(
    batteryService: BatteryService,
    cardboardService: CardboardService,
    communicationService: CommunicationService,
    ironService: IronService,
    plasticService: PlasticService,
    robotService: RobotService,
    saleService: SaleService,
    sensorService: SensorService,
    storageService: StorageService,
    wiringService: WiringService,
  ) {
    const services = [
      batteryService,
      cardboardService,
      communicationService,
      ironService,
      plasticService,
      robotService,
      saleService,
      sensorService,
      storageService,
      wiringService,
    ];

    this._map = Object.fromEntries(services.map((service) => [service.tableName, service as unknown as EntityService<{ id: string }>]));
  }

  public get(tableName: string): EntityService<{ id: string }> {
    const service = this._map[tableName];

    if (!service) {
      throw new Error(`No service registered for table: ${tableName}`);
    }

    return service;
  }
}
