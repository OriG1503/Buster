import { Injectable } from '@nestjs/common';
import { ParsedCommunicationRow, ParsedPlasticRow, ParsedRow, ParsedWiringRow } from './types/parsed-row.type';

const nullIfEmpty = (value: string | null | undefined): string | null =>
  value === '' || value === null || value === undefined ? null : value;

@Injectable()
export class ParsedRowEnricher {
  public enrich(row: ParsedRow): ParsedRow {
    const enrichedPlastic = this._enrichPlastic(row.communication?.plastic ?? null, row.source, row.notes);
    const enrichedCommunication = this._enrichCommunication(row.communication, enrichedPlastic, row.robot_UUID, row.source, row.notes);
    const enrichedWiring = this._enrichWiring(row.wiring, row.source, row.notes);

    return { ...row, communication: enrichedCommunication, wiring: enrichedWiring };
  }

  private _enrichPlastic(plastic: ParsedPlasticRow | null, rowSource: string, rowNotes: string | null): ParsedPlasticRow | null {
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
      notes: rowNotes,
      source: rowSource,
    };
  }

  private _enrichCommunication(
    comm: ParsedCommunicationRow | null,
    enrichedPlastic: ParsedPlasticRow | null,
    robotId: string,
    rowSource: string,
    rowNotes: string | null,
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
      notes: rowNotes,
      source: rowSource,
    };
  }

  private _enrichWiring(wiring: ParsedWiringRow | null, rowSource: string, rowNotes: string | null): ParsedWiringRow | null {
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
      notes: rowNotes,
      source: rowSource,
    };
  }
}
