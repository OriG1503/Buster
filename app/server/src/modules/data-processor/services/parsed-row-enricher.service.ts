import { Injectable } from '@nestjs/common';
import { RobotRepository } from '../../entities/robot/robot.repository';
import { CommunicationRepository } from '../../entities/communication/communication.repository';
import { PlasticRepository } from '../../entities/plastic/plastic.repository';
import { WiringRepository } from '../../entities/wiring/wiring.repository';
import { ParsedCommunicationRow, ParsedPlasticRow, ParsedRow, ParsedWiringRow } from '../types/parsed-row.type';
import { nullIfEmpty } from '../mappers/mapper.utils';

type DbLookupState = {
  readonly existingCommId: string | null;
  readonly existingPlasticId: string | null;
  readonly existingWiringId: string | null;
};

@Injectable()
export class ParsedRowEnricher {
  public constructor(
    private readonly _robotRepository: RobotRepository,
    private readonly _communicationRepository: CommunicationRepository,
    private readonly _plasticRepository: PlasticRepository,
    private readonly _wiringRepository: WiringRepository,
  ) {}

  /**
   * Enriches a parsed row by resolving IDs for intermediate entities that bridge a gap
   * (parent present in row, child present in row, but no intermediate ID provided).
   * Looks up existing intermediates in the DB before creating fictive placeholders.
   */
  public async enrich(row: ParsedRow): Promise<ParsedRow> {
    const robotId = nullIfEmpty(row.robot_UUID);
    const rowCommId = nullIfEmpty(row.communication?.communication_UUID ?? null);

    const dbState = await this._fetchDbState(robotId, rowCommId, row);

    const enrichedPlastic = this._enrichPlastic(row.communication?.plastic ?? null, robotId, rowCommId, row.source, row.notes, dbState);
    const enrichedCommunication = this._enrichCommunication(row.communication, enrichedPlastic, robotId, row.source, row.notes, dbState);
    const enrichedWiring = this._enrichWiring(row.wiring, robotId, row.source, row.notes, dbState);

    return { ...row, communication: enrichedCommunication, wiring: enrichedWiring };
  }

  private async _fetchDbState(robotId: string | null, rowCommId: string | null, row: ParsedRow): Promise<DbLookupState> {
    const dbRobot = robotId ? await this._robotRepository.findById(robotId) : null;

    const existingCommId = dbRobot?.communicationId ?? null;
    const existingWiringId = await this._resolveExistingWiringId(dbRobot?.wiringId ?? null, row);
    const existingPlasticId = await this._resolveExistingPlasticId(rowCommId ?? existingCommId, row);

    return { existingCommId, existingPlasticId, existingWiringId };
  }

  private async _resolveExistingPlasticId(effectiveCommId: string | null, row: ParsedRow): Promise<string | null> {
    if (effectiveCommId) {
      const dbComm = await this._communicationRepository.findById(effectiveCommId);
      if (dbComm?.plasticId) { return dbComm.plasticId; }
    }

    const batteryId = nullIfEmpty(row.communication?.plastic?.battery?.battery_UUID ?? null);
    if (!batteryId) { return null; }

    const dbPlastic = await this._plasticRepository.findByFkValue('batteryId', batteryId);
    return dbPlastic?.id ?? null;
  }

  private async _resolveExistingWiringId(dbRobotWiringId: string | null, row: ParsedRow): Promise<string | null> {
    if (dbRobotWiringId) { return dbRobotWiringId; }

    const storageId = nullIfEmpty(row.wiring?.storage?.storage_UUID ?? null);
    if (!storageId) { return null; }

    const dbWiring = await this._wiringRepository.findByFkValue('storageId', storageId);
    return dbWiring?.id ?? null;
  }

  /**
   * Assigns a plastic UUID when the row has battery data but no plastic UUID.
   * Uses an existing DB plastic if found; otherwise creates an `auto-plastic-for-{batteryId}` placeholder.
   * Only acts when a parent context (robot or comm) is present to justify bridging the gap.
   */
  private _enrichPlastic(
    plastic: ParsedPlasticRow | null,
    robotId: string | null,
    commId: string | null,
    rowSource: string,
    rowNotes: string | null,
    dbState: DbLookupState,
  ): ParsedPlasticRow | null {
    if (!plastic || nullIfEmpty(plastic.plastic_UUID)) { return plastic; }

    const batteryId = nullIfEmpty(plastic.battery?.battery_UUID);
    if (!batteryId) { return plastic; }

    const hasParentContext = !!robotId || !!commId || !!dbState.existingCommId;
    if (!hasParentContext) { return plastic; }

    const plasticId = dbState.existingPlasticId ?? `auto-plastic-for-${batteryId}`;
    return { ...plastic, plastic_UUID: plasticId, source: rowSource, notes: rowNotes };
  }

  /**
   * Assigns a communication UUID when the row has child data (plastic/iron) but no comm UUID.
   * Uses an existing DB comm if found; otherwise creates an `auto-comm-for-{robotId}` placeholder.
   * Only acts when a robot is present in the row to justify bridging the gap.
   */
  private _enrichCommunication(
    comm: ParsedCommunicationRow | null,
    enrichedPlastic: ParsedPlasticRow | null,
    robotId: string | null,
    rowSource: string,
    rowNotes: string | null,
    dbState: DbLookupState,
  ): ParsedCommunicationRow | null {
    if (!comm) { return null; }

    const updated = { ...comm, plastic: enrichedPlastic };
    if (nullIfEmpty(updated.communication_UUID)) { return updated; }

    const hasChildData = !!nullIfEmpty(enrichedPlastic?.plastic_UUID) || !!nullIfEmpty(comm.iron?.iron_UUID);
    if (!hasChildData || !robotId) { return updated; }

    const commId = dbState.existingCommId ?? `auto-comm-for-${robotId}`;
    return { ...updated, communication_UUID: commId, source: rowSource, notes: rowNotes };
  }

  /**
   * Assigns a wiring UUID when the row has storage data but no wiring UUID.
   * Uses an existing DB wiring if found; otherwise creates an `auto-wiring-for-{storageId}` placeholder.
   * Only acts when a robot is present in the row to justify bridging the gap.
   */
  private _enrichWiring(
    wiring: ParsedWiringRow | null,
    robotId: string | null,
    rowSource: string,
    rowNotes: string | null,
    dbState: DbLookupState,
  ): ParsedWiringRow | null {
    if (!wiring || nullIfEmpty(wiring.wiring_UUID)) { return wiring; }

    const storageId = nullIfEmpty(wiring.storage?.storage_UUID);
    if (!storageId || !robotId) { return wiring; }

    const wiringId = dbState.existingWiringId ?? `auto-wiring-for-${storageId}`;
    return { ...wiring, wiring_UUID: wiringId, source: rowSource, notes: rowNotes };
  }
}
