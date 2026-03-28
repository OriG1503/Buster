import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FlyingField } from '../types/flying-field.type';
import { ProcessResult } from '../types/process-result.type';

const YELLOW_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
const LIGHT_RED_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9999' } };

// Converts camelCase mapper field names back to the snake_case CSV column names
const camelToSnake = (str: string): string => str.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);

// Maps each entity table name to its UUID column in the CSV
const ENTITY_UUID_COLUMN: Record<string, string> = {
  batteries: 'battery_UUID', storages: 'storage_UUID', irons: 'iron_UUID',
  plastics: 'plastic_UUID', wirings: 'wiring_UUID', communications: 'communication_UUID',
  cardboards: 'cardboard_UUID', sensors: 'sensor_UUID', robots: 'robot_UUID',
};

type FlyingCellMap = Map<number, { redCols: Set<string>; yellowCols: Set<string> }>;

/** Builds a map of Excel row number → columns to highlight. rowIndex is 0-based; Excel data starts at row 2. */
const toFlyingCellMap = (flyingFields: FlyingField[]): FlyingCellMap => {
  const map: FlyingCellMap = new Map();
  flyingFields.forEach(({ redFields, yellowFields, entity, rowIndex, isUuidRed }) => {
    const excelRow = rowIndex + 2;
    if (!map.has(excelRow)) { map.set(excelRow, { redCols: new Set(), yellowCols: new Set() }); }
    const entry = map.get(excelRow)!;
    redFields.map(camelToSnake).forEach((col) => entry.redCols.add(col));
    yellowFields.map(camelToSnake).forEach((col) => entry.yellowCols.add(col));
    const uuidCol = ENTITY_UUID_COLUMN[entity];
    if (uuidCol) {
      if (isUuidRed) { entry.redCols.add(uuidCol); }
      else { entry.yellowCols.add(uuidCol); }
    }
  });
  return map;
};

@Injectable()
export class ProcessReportService {
  /**
   * Reads the saved CSV, converts it to an Excel workbook, and highlights flying fields:
   * - Empty UUID cell → yellow
   * - Data fields of the flying entity → light red
   */
  public async generate(csvPath: string, result: ProcessResult): Promise<Buffer> {
    const flyingCellMap = toFlyingCellMap(result.flyingFields);
    const workbook = new ExcelJS.Workbook();
    const sheet = await workbook.csv.readFile(csvPath);

    const headerColMap = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, colIndex) => {
      cell.font = { bold: true };
      headerColMap.set(String(cell.value).trim(), colIndex);
    });

    flyingCellMap.forEach(({ redCols, yellowCols }, excelRowNumber) => {
      const row = sheet.getRow(excelRowNumber);
      redCols.forEach((col) => {
        const colIndex = headerColMap.get(col);
        if (colIndex !== undefined) { row.getCell(colIndex).fill = LIGHT_RED_FILL; }
      });
      yellowCols.forEach((col) => {
        const colIndex = headerColMap.get(col);
        if (colIndex !== undefined) { row.getCell(colIndex).fill = YELLOW_FILL; }
      });
    });

    sheet.columns.forEach((col) => { col.width = 22; });
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
