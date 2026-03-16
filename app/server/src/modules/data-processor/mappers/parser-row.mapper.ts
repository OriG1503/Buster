import { Injectable } from '@nestjs/common';
import {
  ParsedRow,
  ParsedBatteryRow,
  ParsedStorageRow,
  ParsedIronRow,
  ParsedPlasticRow,
  ParsedCommunicationRow,
} from '../types/parsed-row.type';
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

const nullIfEmpty = (value: string | null | undefined): string | null =>
  value === '' || value === null || value === undefined ? null : value;

const parseBool = (value: string | null | undefined): boolean | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (value === 'True') {
    return true;
  }
  if (value === 'False') {
    return false;
  }
  return null;
};

@Injectable()
export class ParserRowMapper {
  public mapBattery(row: ParsedRow): MappedBattery | null {
    return this._mapBatteryRow(row.communication?.plastic?.battery ?? null);
  }

  public mapStorage(row: ParsedRow): MappedStorage | null {
    return this._mapStorageRow(row.wiring?.storage ?? null);
  }

  public mapIron(row: ParsedRow): MappedIron | null {
    return this._mapIronRow(row.communication?.iron ?? null);
  }

  public mapPlastic(row: ParsedRow): MappedPlastic | null {
    return this._mapPlasticRow(row.communication?.plastic ?? null);
  }

  public mapWiring(row: ParsedRow): MappedWiring | null {
    const raw = row.wiring;
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.wiring_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      wiringType: nullIfEmpty(raw.wiring_type),
      district: nullIfEmpty(raw.district),
      municipality: nullIfEmpty(raw.municipality),
      storageId: raw.storage ? nullIfEmpty(raw.storage.storage_UUID) : null,
    };
  }

  public mapCommunication(row: ParsedRow): MappedCommunication | null {
    return this._mapCommunicationRow(row.communication);
  }

  public mapCardboard(row: ParsedRow): MappedCardboard | null {
    const raw = row.cardboard;
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.cardboard_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      cardboardType: nullIfEmpty(raw.cardboard_type),
      cardboardVersion: nullIfEmpty(raw.cardboard_version),
    };
  }

  public mapSensor(row: ParsedRow): MappedSensor | null {
    const raw = row.sensor;
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.sensor_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      sensorType: nullIfEmpty(raw.sensor_type),
      sensorVersion: nullIfEmpty(raw.sensor_version),
    };
  }

  public mapSale(row: ParsedRow): MappedSale | null {
    const raw = row.sale;
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.sale_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      carrier: nullIfEmpty(raw.carrier),
      onlineStoreName: nullIfEmpty(raw.online_store_name),
      salesperson: nullIfEmpty(raw.salesperson),
      isPurchased: parseBool(raw.is_purchased),
      isStockAshdod: parseBool(raw.is_stock_ashdod),
      isStockTelAviv: parseBool(raw.is_stock_tel_aviv),
      isStockRehovot: parseBool(raw.is_stock_rehovot),
      dataSource: nullIfEmpty(raw.data_source),
    };
  }

  public mapRobot(row: ParsedRow): MappedRobot | null {
    const id = nullIfEmpty(row.robot_UUID);
    if (!id) {
      return null;
    }
    return {
      id,
      source: row.source,
      notes: row.notes,
      cardboardId: row.cardboard ? nullIfEmpty(row.cardboard.cardboard_UUID) : null,
      sensorId: row.sensor ? nullIfEmpty(row.sensor.sensor_UUID) : null,
      communicationId: row.communication ? nullIfEmpty(row.communication.communication_UUID) : null,
      saleId: row.sale ? nullIfEmpty(row.sale.sale_UUID) : null,
      wiringId: row.wiring ? nullIfEmpty(row.wiring.wiring_UUID) : null,
    };
  }

  private _mapBatteryRow(raw: ParsedBatteryRow | null): MappedBattery | null {
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.battery_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      sku: nullIfEmpty(raw.sku),
      batteryType: nullIfEmpty(raw.battery_type),
      batteryVersion: nullIfEmpty(raw.battery_version),
      lithiumVersion: nullIfEmpty(raw.lithium_version),
    };
  }

  private _mapStorageRow(raw: ParsedStorageRow | null): MappedStorage | null {
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.storage_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      storageType: nullIfEmpty(raw.storage_type),
      storageVersion: nullIfEmpty(raw.storage_version),
      isStockNetanya: parseBool(raw.is_stock_netanya),
      isStockAfula: parseBool(raw.is_stock_afula),
    };
  }

  private _mapIronRow(raw: ParsedIronRow | null): MappedIron | null {
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.iron_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      ironType: nullIfEmpty(raw.iron_type),
      ironVersion: nullIfEmpty(raw.iron_version),
      isHeatConductor: parseBool(raw.is_heat_conductor),
    };
  }

  private _mapPlasticRow(raw: ParsedPlasticRow | null): MappedPlastic | null {
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.plastic_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      plasticType: nullIfEmpty(raw.plastic_type),
      batteryId: raw.battery ? nullIfEmpty(raw.battery.battery_UUID) : null,
    };
  }

  private _mapCommunicationRow(raw: ParsedCommunicationRow | null): MappedCommunication | null {
    if (!raw) {
      return null;
    }
    return {
      id: nullIfEmpty(raw.communication_UUID) as string,
      source: raw.source,
      notes: raw.notes,
      communicationType: nullIfEmpty(raw.communication_type),
      plasticId: raw.plastic ? nullIfEmpty(raw.plastic.plastic_UUID) : null,
      ironId: raw.iron ? nullIfEmpty(raw.iron.iron_UUID) : null,
    };
  }
}
