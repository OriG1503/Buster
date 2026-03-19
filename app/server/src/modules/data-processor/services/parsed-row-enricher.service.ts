import { Injectable } from '@nestjs/common';
import { ParsedCommunicationRow, ParsedPlasticRow, ParsedRow, ParsedWiringRow } from '../types/parsed-row.type';
import { nullIfEmpty } from '../mappers/mapper.utils';

@Injectable()
export class ParsedRowEnricher {
  /** Auto-generates UUIDs for intermediate entities that have child data but no own UUID. */
  public enrich(row: ParsedRow): ParsedRow {
    const enrichedPlastic = this._enrichPlastic(row.communication?.plastic ?? null, row.source, row.notes);
    const enrichedCommunication = this._enrichCommunication(row.communication, enrichedPlastic, row.robot_UUID, row.source, row.notes);
    const enrichedWiring = this._enrichWiring(row.wiring, row.source, row.notes);
    
    return { ...row, communication: enrichedCommunication, wiring: enrichedWiring };
  }

  /** Assigns `auto-plastic-for-{batteryId}` when plastic has no UUID but has a battery child. */
  private _enrichPlastic(plastic: ParsedPlasticRow | null, rowSource: string, rowNotes: string | null): ParsedPlasticRow | null {
    if (!plastic || nullIfEmpty(plastic.plastic_UUID)) { return plastic; }
    const batteryId = nullIfEmpty(plastic.battery?.battery_UUID);
    if (!batteryId) { return plastic; }
    return { ...plastic, plastic_UUID: `auto-plastic-for-${batteryId}`, source: rowSource, notes: rowNotes };
  }

  /** Assigns `auto-comm-for-{robotId}` when communication has no UUID but has plastic or iron child data. */
  private _enrichCommunication(
    comm: ParsedCommunicationRow | null, enrichedPlastic: ParsedPlasticRow | null,
    robotId: string, rowSource: string, rowNotes: string | null,
  ): ParsedCommunicationRow | null {
    if (!comm) { return null; }

    const updated = { ...comm, plastic: enrichedPlastic };

    if (nullIfEmpty(updated.communication_UUID)) { return updated; }

    const hasChildData = !!nullIfEmpty(enrichedPlastic?.plastic_UUID) || !!nullIfEmpty(comm.iron?.iron_UUID);

    if (!hasChildData) { return updated; }
    return { ...updated, communication_UUID: `auto-comm-for-${robotId}`, source: rowSource, notes: rowNotes };
  }

  /** Assigns `auto-wiring-for-{storageId}` when wiring has no UUID but has a storage child. */
  private _enrichWiring(wiring: ParsedWiringRow | null, rowSource: string, rowNotes: string | null): ParsedWiringRow | null {
    if (!wiring || nullIfEmpty(wiring.wiring_UUID)) { return wiring; }
    const storageId = nullIfEmpty(wiring.storage?.storage_UUID);
    if (!storageId) { return wiring; }
    return { ...wiring, wiring_UUID: `auto-wiring-for-${storageId}`, source: rowSource, notes: rowNotes };
  }
}
