import { Injectable } from '@nestjs/common';
import { BatteryService } from '../../modules/entities/battery/battery.service';
import { CardboardService } from '../../modules/entities/cardboard/cardboard.service';
import { CommunicationService } from '../../modules/entities/communication/communication.service';
import { IronService } from '../../modules/entities/iron/iron.service';
import { PlasticService } from '../../modules/entities/plastic/plastic.service';
import { RobotService } from '../../modules/entities/robot/robot.service';
import { SaleService } from '../../modules/entities/sale/sale.service';
import { SensorService } from '../../modules/entities/sensor/sensor.service';
import { StorageService } from '../../modules/entities/storage/storage.service';
import { WiringService } from '../../modules/entities/wiring/wiring.service';
import { EntityService } from '../../modules/data-processor/types/entity-service.type';

/**
 * Service locator that maps each entity table name to its BaseService instance.
 * Used by DataProcessorService and ConflictResolverService to dispatch to the
 * correct service at runtime without per-entity branching.
 */
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

    this._map = Object.fromEntries(services.map((service) => [service.tableName, service as object as EntityService<{ id: string }>]));
  }

  /** Returns the service for the given table name. Throws if no service is registered. */
  public get(tableName: string): EntityService<{ id: string }> {
    const service = this._map[tableName];

    if (!service) {
      throw new Error(`No service registered for table: ${tableName}`);
    }

    return service;
  }
}
