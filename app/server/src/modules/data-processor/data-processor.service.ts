import { Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { ConflictRepository } from '../conflict/conflict.repository';
import { ConflictService } from '../conflict/conflict.service';
import { ConflictEntity } from '../conflict/entities/conflict.entity';
import { BatteryService } from '../battery/battery.service';
import { StorageService } from '../storage/storage.service';
import { IronService } from '../iron/iron.service';
import { PlasticService } from '../plastic/plastic.service';
import { WiringService } from '../wiring/wiring.service';
import { CommunicationService } from '../communication/communication.service';
import { CardboardService } from '../cardboard/cardboard.service';
import { SensorService } from '../sensor/sensor.service';
import { SaleService } from '../sale/sale.service';
import { RobotService } from '../robot/robot.service';
import { ParserRowMapper } from './mappers/parser-row.mapper';
import { ParsedRow } from './types/parsed-row.type';
import { EntityService } from './types/entity-service.type';

@Injectable()
export class DataProcessorService {
  public constructor(
    private readonly _mapper: ParserRowMapper,
    private readonly _conflictService: ConflictService,
    private readonly _conflictRepository: ConflictRepository,
    private readonly _batteryService: BatteryService,
    private readonly _storageService: StorageService,
    private readonly _ironService: IronService,
    private readonly _plasticService: PlasticService,
    private readonly _wiringService: WiringService,
    private readonly _communicationService: CommunicationService,
    private readonly _cardboardService: CardboardService,
    private readonly _sensorService: SensorService,
    private readonly _saleService: SaleService,
    private readonly _robotService: RobotService,
  ) {}

  public async process(rows: ParsedRow[]): Promise<void> {
    await Promise.all(rows.map((row) => this._processRow(row)));
  }

  private async _processRow(row: ParsedRow): Promise<void> {
    await this._processEntity(
      this._mapper.mapBattery(row),
      'batteries',
      this._batteryService as EntityService<{ id: string }>,
    );
    await this._processEntity(
      this._mapper.mapStorage(row),
      'storages',
      this._storageService as EntityService<{ id: string }>,
    );
    await this._processEntity(this._mapper.mapIron(row), 'irons', this._ironService as EntityService<{ id: string }>);
    await this._processEntity(
      this._mapper.mapPlastic(row),
      'plastics',
      this._plasticService as EntityService<{ id: string }>,
    );
    await this._processEntity(
      this._mapper.mapWiring(row),
      'wirings',
      this._wiringService as EntityService<{ id: string }>,
    );
    await this._processEntity(
      this._mapper.mapCommunication(row),
      'communications',
      this._communicationService as EntityService<{ id: string }>,
    );
    await this._processEntity(
      this._mapper.mapCardboard(row),
      'cardboards',
      this._cardboardService as EntityService<{ id: string }>,
    );
    await this._processEntity(
      this._mapper.mapSensor(row),
      'sensors',
      this._sensorService as EntityService<{ id: string }>,
    );
    await this._processEntity(this._mapper.mapSale(row), 'sales', this._saleService as EntityService<{ id: string }>);
    await this._processEntity(
      this._mapper.mapRobot(row),
      'robots',
      this._robotService as EntityService<{ id: string }>,
    );
  }

  private async _processEntity<TData extends { id: string; fileSource: string }>(
    mapped: TData | null,
    tableName: string,
    service: EntityService<TData>,
  ): Promise<void> {
    if (!mapped?.id) {
      return;
    }

    const { fileSource, id, ...entityFields } = mapped;
    const existing = await service.findById(id);

    if (!existing) {
      await service.insert({ id, ...entityFields } as TData, fileSource);
      return;
    }

    const result = this._conflictService.detectConflicts(
      tableName,
      id,
      existing as Record<string, unknown>,
      existing.source,
      entityFields as Record<string, unknown>,
      fileSource,
    );

    await Promise.all(
      result.conflictsToCreate.map((conflict: DeepPartial<ConflictEntity>) =>
        this._conflictRepository.insert(conflict),
      ),
    );

    if (Object.keys(result.fieldsToUpdate).length > 0) {
      await service.update(id, result.fieldsToUpdate, result.sourceUpdates, existing.source);
    }
  }
}
