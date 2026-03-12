import { Injectable } from '@nestjs/common';
import { ParsedCommunicationRow, ParsedPlasticRow, ParsedRow, ParsedWiringRow } from './types/parsed-row.type';

const SERVER_GENERATED_SOURCE = 'server-generated';

const nullIfEmpty = (value: string | null | undefined): string | null =>
  value === '' || value === null || value === undefined ? null : value;

@Injectable()
export class ParsedRowEnricher {
  public enrich(row: ParsedRow): ParsedRow {
    const enrichedPlastic = this._enrichPlastic(row.communication?.plastic ?? null);
    const enrichedCommunication = this._enrichCommunication(row.communication, enrichedPlastic, row.robot_UUID);
    const enrichedWiring = this._enrichWiring(row.wiring);

    return { ...row, communication: enrichedCommunication, wiring: enrichedWiring };
  }

  private _enrichPlastic(plastic: ParsedPlasticRow | null): ParsedPlasticRow | null {
    if (!plastic) {
      return null;
    }

    if (nullIfEmpty(plastic.plastic_UUID)) {
      return plastic;
    }

    const batteryId = nullIfEmpty(plastic.battery?.battery_UUID);

    if (!batteryId) {
      return plastic;
    }

    return {
      ...plastic,
      plastic_UUID: `auto-plastic-for-${batteryId}`,
      source: SERVER_GENERATED_SOURCE,
    };
  }

  private _enrichCommunication(
    comm: ParsedCommunicationRow | null,
    enrichedPlastic: ParsedPlasticRow | null,
    robotId: string,
  ): ParsedCommunicationRow | null {
    if (!comm) {
      return null;
    }

    const updated = { ...comm, plastic: enrichedPlastic };

    if (nullIfEmpty(updated.communication_UUID)) {
      return updated;
    }

    const hasPlasticData = !!nullIfEmpty(enrichedPlastic?.plastic_UUID);
    const hasIronData = !!nullIfEmpty(comm.iron?.iron_UUID);

    if (!hasPlasticData && !hasIronData) {
      return updated;
    }

    return {
      ...updated,
      communication_UUID: `auto-comm-for-${robotId}`,
      source: SERVER_GENERATED_SOURCE,
    };
  }

  private _enrichWiring(wiring: ParsedWiringRow | null): ParsedWiringRow | null {
    if (!wiring) {
      return null;
    }

    if (nullIfEmpty(wiring.wiring_UUID)) {
      return wiring;
    }

    const storageId = nullIfEmpty(wiring.storage?.storage_UUID);

    if (!storageId) {
      return wiring;
    }

    return {
      ...wiring,
      wiring_UUID: `auto-wiring-for-${storageId}`,
      source: SERVER_GENERATED_SOURCE,
    };
  }
}
