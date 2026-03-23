import { Injectable } from '@nestjs/common';
import { ParsedCommunicationRow, ParsedPlasticRow, ParsedRow, ParsedWiringRow } from '../types/parsed-row.type';
import { nullIfEmpty } from '../mappers/mapper.utils';

@Injectable()
export class ParsedRowEnricher {
  /** Auto-generates UUIDs for intermediate entities that have child data but no own UUID. */
  public enrich(row: ParsedRow): ParsedRow {
    const robotId = nullIfEmpty(row.robot_UUID);
    const commId = nullIfEmpty(row.communication?.communication_UUID ?? null);

    const enrichedPlastic = this._enrichPlastic(row.communication?.plastic ?? null, robotId, commId, row.source, row.notes);
    const enrichedCommunication = this._enrichCommunication(row.communication, enrichedPlastic, robotId, row.source, row.notes);
    const enrichedWiring = this._enrichWiring(row.wiring, robotId, row.source, row.notes);

    return { ...row, communication: enrichedCommunication, wiring: enrichedWiring };
  }

  /**
   * Assigns `auto-plastic-for-{batteryId}` when plastic has no UUID but has a battery child.
   * Only creates a fictive when a parent entity (robot or communication) is present in the row —
   * otherwise there is no gap to bridge and no reason to create an intermediate entity.
   */
  private _enrichPlastic(
    plastic: ParsedPlasticRow | null,
    robotId: string | null,
    commId: string | null,
    rowSource: string,
    rowNotes: string | null,
  ): ParsedPlasticRow | null {
    if (!plastic || nullIfEmpty(plastic.plastic_UUID)) { return plastic; }
    const batteryId = nullIfEmpty(plastic.battery?.battery_UUID);
    if (!batteryId) { return plastic; }
    if (!robotId && !commId) { return plastic; }
    return { ...plastic, plastic_UUID: `auto-plastic-for-${batteryId}`, source: rowSource, notes: rowNotes };
  }

  /**
   * Assigns `auto-comm-for-{robotId}` when communication has no UUID but has plastic or iron child data.
   * Only creates a fictive when a robot is present in the row — otherwise there is no gap to bridge.
   */
  private _enrichCommunication(
    comm: ParsedCommunicationRow | null,
    enrichedPlastic: ParsedPlasticRow | null,
    robotId: string | null,
    rowSource: string,
    rowNotes: string | null,
  ): ParsedCommunicationRow | null {
    if (!comm) { return null; }

    const updated = { ...comm, plastic: enrichedPlastic };

    if (nullIfEmpty(updated.communication_UUID)) { return updated; }

    const hasChildData = !!nullIfEmpty(enrichedPlastic?.plastic_UUID) || !!nullIfEmpty(comm.iron?.iron_UUID);

    if (!hasChildData || !robotId) { return updated; }
    return { ...updated, communication_UUID: `auto-comm-for-${robotId}`, source: rowSource, notes: rowNotes };
  }

  /**
   * Assigns `auto-wiring-for-{storageId}` when wiring has no UUID but has a storage child.
   * Only creates a fictive when a robot is present in the row — otherwise there is no gap to bridge.
   */
  private _enrichWiring(
    wiring: ParsedWiringRow | null,
    robotId: string | null,
    rowSource: string,
    rowNotes: string | null,
  ): ParsedWiringRow | null {
    if (!wiring || nullIfEmpty(wiring.wiring_UUID)) { return wiring; }
    const storageId = nullIfEmpty(wiring.storage?.storage_UUID);
    if (!storageId || !robotId) { return wiring; }
    return { ...wiring, wiring_UUID: `auto-wiring-for-${storageId}`, source: rowSource, notes: rowNotes };
  }
}
