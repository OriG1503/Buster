import { Injectable } from '@nestjs/common';
import { MappedEntity } from '../../../shared/types/mapped-entity.type';
import { BatteryInsertData } from '../../entities/battery/types/battery-insert-data.type';
import { StorageInsertData } from '../../entities/storage/types/storage-insert-data.type';
import { IronInsertData } from '../../entities/iron/types/iron-insert-data.type';
import { PlasticInsertData } from '../../entities/plastic/types/plastic-insert-data.type';
import { WiringInsertData } from '../../entities/wiring/types/wiring-insert-data.type';
import { CommunicationInsertData } from '../../entities/communication/types/communication-insert-data.type';
import { CardboardInsertData } from '../../entities/cardboard/types/cardboard-insert-data.type';
import { SensorInsertData } from '../../entities/sensor/types/sensor-insert-data.type';
import { RobotInsertData } from '../../entities/robot/types/robot-insert-data.type';
import { ParsedRow } from '../types/parsed-row.type';
import { mapBatteryRow } from './battery.mapper';
import { mapStorageRow } from './storage.mapper';
import { mapIronRow } from './iron.mapper';
import { mapPlasticRow } from './plastic.mapper';
import { mapWiringRow } from './wiring.mapper';
import { mapCommunicationRow } from './communication.mapper';
import { mapCardboardRow } from './cardboard.mapper';
import { mapSensorRow } from './sensor.mapper';
import { mapRobotRow } from './robot.mapper';

@Injectable()
export class ParserRowMapper {
  public mapBattery(row: ParsedRow): MappedEntity<BatteryInsertData> | null { return mapBatteryRow(row.communication?.plastic?.battery ?? null); }
  public mapStorage(row: ParsedRow): MappedEntity<StorageInsertData> | null { return mapStorageRow(row.wiring?.storage ?? null); }
  public mapIron(row: ParsedRow): MappedEntity<IronInsertData> | null { return mapIronRow(row.communication?.iron ?? null); }
  public mapPlastic(row: ParsedRow): MappedEntity<PlasticInsertData> | null { return mapPlasticRow(row.communication?.plastic ?? null); }
  public mapWiring(row: ParsedRow): MappedEntity<WiringInsertData> | null { return mapWiringRow(row); }
  public mapCommunication(row: ParsedRow): MappedEntity<CommunicationInsertData> | null { return mapCommunicationRow(row.communication); }
  public mapCardboard(row: ParsedRow): MappedEntity<CardboardInsertData> | null { return mapCardboardRow(row); }
  public mapSensor(row: ParsedRow): MappedEntity<SensorInsertData> | null { return mapSensorRow(row); }
  public mapRobot(row: ParsedRow): MappedEntity<RobotInsertData> | null { return mapRobotRow(row); }
}
