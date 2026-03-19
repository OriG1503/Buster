import { Injectable } from '@nestjs/common';
import { ParsedRow } from '../types/parsed-row.type';
import { MappedBattery } from '../types/mapped-battery.type';
import { MappedStorage } from '../types/mapped-storage.type';
import { MappedIron } from '../types/mapped-iron.type';
import { MappedPlastic } from '../types/mapped-plastic.type';
import { MappedWiring } from '../types/mapped-wiring.type';
import { MappedCommunication } from '../types/mapped-communication.type';
import { MappedCardboard } from '../types/mapped-cardboard.type';
import { MappedSensor } from '../types/mapped-sensor.type';
import { MappedSale } from '../types/mapped-sale.type';
import { MappedRobot } from '../types/mapped-robot.type';
import { mapBatteryRow } from './battery.mapper';
import { mapStorageRow } from './storage.mapper';
import { mapIronRow } from './iron.mapper';
import { mapPlasticRow } from './plastic.mapper';
import { mapWiringRow } from './wiring.mapper';
import { mapCommunicationRow } from './communication.mapper';
import { mapCardboardRow } from './cardboard.mapper';
import { mapSensorRow } from './sensor.mapper';
import { mapSaleRow } from './sale.mapper';
import { mapRobotRow } from './robot.mapper';

@Injectable()
export class ParserRowMapper {
  public mapBattery(row: ParsedRow): MappedBattery | null { return mapBatteryRow(row.communication?.plastic?.battery ?? null); }
  public mapStorage(row: ParsedRow): MappedStorage | null { return mapStorageRow(row.wiring?.storage ?? null); }
  public mapIron(row: ParsedRow): MappedIron | null { return mapIronRow(row.communication?.iron ?? null); }
  public mapPlastic(row: ParsedRow): MappedPlastic | null { return mapPlasticRow(row.communication?.plastic ?? null); }
  public mapWiring(row: ParsedRow): MappedWiring | null { return mapWiringRow(row); }
  public mapCommunication(row: ParsedRow): MappedCommunication | null { return mapCommunicationRow(row.communication); }
  public mapCardboard(row: ParsedRow): MappedCardboard | null { return mapCardboardRow(row); }
  public mapSensor(row: ParsedRow): MappedSensor | null { return mapSensorRow(row); }
  public mapSale(row: ParsedRow): MappedSale | null { return mapSaleRow(row); }
  public mapRobot(row: ParsedRow): MappedRobot | null { return mapRobotRow(row); }
}
