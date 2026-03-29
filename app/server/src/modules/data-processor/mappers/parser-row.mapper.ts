import { Injectable } from '@nestjs/common';
import {
  BATTERY_CONFIG, CARDBOARD_CONFIG, COMMUNICATION_CONFIG, IRON_CONFIG,
  PLASTIC_CONFIG, ROBOT_CONFIG, SENSOR_CONFIG, STORAGE_CONFIG, WIRING_CONFIG,
} from '../../../shared/consts/entity-configs.const';
import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { BatteryInsertData } from '../../entities/battery/types/battery-insert-data.type';
import { CardboardInsertData } from '../../entities/cardboard/types/cardboard-insert-data.type';
import { CommunicationInsertData } from '../../entities/communication/types/communication-insert-data.type';
import { IronInsertData } from '../../entities/iron/types/iron-insert-data.type';
import { PlasticInsertData } from '../../entities/plastic/types/plastic-insert-data.type';
import { RobotInsertData } from '../../entities/robot/types/robot-insert-data.type';
import { SensorInsertData } from '../../entities/sensor/types/sensor-insert-data.type';
import { StorageInsertData } from '../../entities/storage/types/storage-insert-data.type';
import { WiringInsertData } from '../../entities/wiring/types/wiring-insert-data.type';
import { ParsedRow } from '../types/parsed-row.type';
import { mapEntityRow } from './entity-row-mapper.util';
import { nullIfEmpty } from './mapper.utils';

@Injectable()
export class ParserRowMapper {
  public mapBattery(row: ParsedRow): MappedEntity<BatteryInsertData> | null {
    return mapEntityRow(BATTERY_CONFIG.columns, row.communication?.plastic?.battery ?? null);
  }

  public mapStorage(row: ParsedRow): MappedEntity<StorageInsertData> | null {
    return mapEntityRow(STORAGE_CONFIG.columns, row.wiring?.storage ?? null);
  }

  public mapIron(row: ParsedRow): MappedEntity<IronInsertData> | null {
    return mapEntityRow(IRON_CONFIG.columns, row.communication?.iron ?? null);
  }

  public mapCardboard(row: ParsedRow): MappedEntity<CardboardInsertData> | null {
    return mapEntityRow(CARDBOARD_CONFIG.columns, row.cardboard ?? null);
  }

  public mapSensor(row: ParsedRow): MappedEntity<SensorInsertData> | null {
    return mapEntityRow(SENSOR_CONFIG.columns, row.sensor ?? null);
  }

  public mapPlastic(row: ParsedRow): MappedEntity<PlasticInsertData> | null {
    const base = mapEntityRow(PLASTIC_CONFIG.columns, row.communication?.plastic ?? null);
    if (!base) { return null; }
    return { ...base, batteryId: nullIfEmpty(row.communication?.plastic?.battery?.battery_UUID ?? null) };
  }

  public mapWiring(row: ParsedRow): MappedEntity<WiringInsertData> | null {
    const base = mapEntityRow(WIRING_CONFIG.columns, row.wiring ?? null);
    if (!base) { return null; }
    return { ...base, storageId: nullIfEmpty(row.wiring?.storage?.storage_UUID ?? null) };
  }

  public mapCommunication(row: ParsedRow): MappedEntity<CommunicationInsertData> | null {
    const base = mapEntityRow(COMMUNICATION_CONFIG.columns, row.communication ?? null);
    if (!base) { return null; }
    return {
      ...base,
      plasticId: nullIfEmpty(row.communication?.plastic?.plastic_UUID ?? null),
      ironId: nullIfEmpty(row.communication?.iron?.iron_UUID ?? null),
    };
  }

  public mapRobot(row: ParsedRow): MappedEntity<RobotInsertData> | null {
    const base = mapEntityRow(ROBOT_CONFIG.columns, row);
    if (!base) { return null; }
    return {
      ...base,
      cardboardId: nullIfEmpty(row.cardboard?.cardboard_UUID ?? null),
      sensorId: nullIfEmpty(row.sensor?.sensor_UUID ?? null),
      communicationId: nullIfEmpty(row.communication?.communication_UUID ?? null),
      wiringId: nullIfEmpty(row.wiring?.wiring_UUID ?? null),
    };
  }
}
