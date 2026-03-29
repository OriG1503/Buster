import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { YELLOW_FILL, LIGHT_RED_FILL } from '../consts/report-cell-fills.const';
import { ENTITY_UUID_COLUMN } from '../consts/entity-uuid-column.const';
import { FlyingField } from '../types/flying-field.type';
import { FlyingCellMap } from '../types/flying-cell-map.type';
import { ProcessResult } from '../types/process-result.type';

@Injectable()
export class ProcessReportService {
  /**
   * Reads the saved CSV, converts it to an Excel workbook, and highlights flying fields:
   * - Empty UUID cell → yellow
   * - Data fields of the flying entity → light red
   */
  public async generate(csvPath: string, result: ProcessResult): Promise<Buffer> {
    const flyingCellMap = this._buildFlyingCellMap(result.flyingFields);
    const workbook = new ExcelJS.Workbook();
    const sheet = await workbook.csv.readFile(csvPath);

    const headerColMap = this._buildHeaderColMap(sheet);
    this._applyHighlights(sheet, flyingCellMap, headerColMap);

    sheet.columns.forEach((col) => { col.width = 22; });
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  /** Builds a map of Excel row number → columns to highlight. rowIndex is 0-based; Excel data starts at row 2. */
  private _buildFlyingCellMap(flyingFields: FlyingField[]): FlyingCellMap {
    const map: FlyingCellMap = new Map();
    flyingFields.forEach(({ redFields, yellowFields, entity, rowIndex, isUuidRed }) => {
      const excelRow = rowIndex + 2;
      if (!map.has(excelRow)) { map.set(excelRow, { redCols: new Set(), yellowCols: new Set() }); }
      const entry = map.get(excelRow)!;
      redFields.map(this._camelToSnake).forEach((col) => entry.redCols.add(col));
      yellowFields.map(this._camelToSnake).forEach((col) => entry.yellowCols.add(col));
      const uuidCol = ENTITY_UUID_COLUMN[entity];
      if (uuidCol) {
        if (isUuidRed) { entry.redCols.add(uuidCol); } else { entry.yellowCols.add(uuidCol); }
      }
    });
    return map;
  }

  /** Builds a map of CSV column name → 1-based Excel column index from the header row. */
  private _buildHeaderColMap(sheet: ExcelJS.Worksheet): Map<string, number> {
    const headerColMap = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, colIndex) => {
      cell.font = { bold: true };
      headerColMap.set(String(cell.value).trim(), colIndex);
    });
    return headerColMap;
  }

  /** Applies red/yellow fills to the cells identified in the flying-cell map. */
  private _applyHighlights(sheet: ExcelJS.Worksheet, flyingCellMap: FlyingCellMap, headerColMap: Map<string, number>): void {
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
  }

  /** Converts camelCase field names back to the snake_case CSV column names. */
  private _camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
  }
}
