import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FlyingField } from './types/flying-field.type';
import { ProcessResult } from './types/process-result.type';

// Yellow — used for the empty UUID cell of a flying entity
const YELLOW_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
// Light red — used for the data fields of a flying entity (fields with values but no UUID)
const LIGHT_RED_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9999' } };

// Converts camelCase field names (from the mapper) back to snake_case CSV column names
const camelToSnake = (str: string): string => str.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);

// Maps each entity table name to its UUID CSV column name
// Used to locate and highlight the empty UUID cell in a flying row
const ENTITY_UUID_COLUMN: Record<string, string> = {
  batteries: 'battery_UUID',
  storages: 'storage_UUID',
  irons: 'iron_UUID',
  plastics: 'plastic_UUID',
  wirings: 'wiring_UUID',
  communications: 'communication_UUID',
  cardboards: 'cardboard_UUID',
  sensors: 'sensor_UUID',
  sales: 'sale_UUID',
  robots: 'robot_UUID',
};

// Per Excel row: the set of data columns to paint light red, and all UUID columns to paint yellow
type FlyingCellMap = Map<number, { dataCols: Set<string>; uuidCols: Set<string> }>;

// Builds a map of Excel row number → flying cell info.
// rowIndex is 0-based (position in the parsed rows array).
// Excel row 1 is the header, so data rows start at 2: excelRow = rowIndex + 2.
const toFlyingCellMap = (flyingFields: FlyingField[]): FlyingCellMap => {
  const map: FlyingCellMap = new Map();
  flyingFields.forEach(({ fields, entity, rowIndex }) => {
    const excelRow = rowIndex + 2;
    if (!map.has(excelRow)) { map.set(excelRow, { dataCols: new Set(), uuidCols: new Set() }); }
    const entry = map.get(excelRow)!;
    fields.map(camelToSnake).forEach((col) => entry.dataCols.add(col));
    const uuidCol = ENTITY_UUID_COLUMN[entity];
    if (uuidCol) { entry.uuidCols.add(uuidCol); }
  });
  return map;
};

@Injectable()
export class ProcessReportService {
  // Reads the saved CSV, converts it to Excel, and highlights any flying fields:
  // - Empty UUID cell → yellow
  // - Data fields belonging to the flying entity → light red
  public async generate(csvPath: string, result: ProcessResult): Promise<Buffer> {
    const flyingCellMap = toFlyingCellMap(result.flyingFields);

    const workbook = new ExcelJS.Workbook();
    const sheet = await workbook.csv.readFile(csvPath);

    // Bold the header row and build a column name → index map for lookups
    const headerColMap = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, colIndex) => {
      cell.font = { bold: true };
      headerColMap.set(String(cell.value), colIndex);
    });

    // Apply highlights row by row based on the flying cell map
    flyingCellMap.forEach(({ dataCols, uuidCols }, excelRowNumber) => {
      const row = sheet.getRow(excelRowNumber);

      // Light red on each flying data field
      dataCols.forEach((col) => {
        const colIndex = headerColMap.get(col);
        if (colIndex !== undefined) {
          row.getCell(colIndex).fill = LIGHT_RED_FILL;
        }
      });

      // Yellow on every empty UUID cell in this row
      uuidCols.forEach((uuidCol) => {
        const uuidColIndex = headerColMap.get(uuidCol);
        if (uuidColIndex !== undefined) {
          row.getCell(uuidColIndex).fill = YELLOW_FILL;
        }
      });
    });

    sheet.columns.forEach((col) => { col.width = 22; });

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
