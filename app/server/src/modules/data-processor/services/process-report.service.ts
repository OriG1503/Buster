import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { LoggerService } from '../../../shared/services/logger/logger.service';
import { YELLOW_FILL, LIGHT_RED_FILL, ORANGE_FILL } from '../consts/report-cell-fills.const';
import { FlyingField } from '../types/flying-field.type';
import { FlyingCellMap } from '../types/flying-cell-map.type';
import { ProcessResult } from '../types/process-result.type';
import { FieldConfig } from '../../../shared/types/entity-config.type';
import { EntityCatalogService } from '../../entity-catalog/entity-catalog.service';

@Injectable()
export class ProcessReportService {
  public constructor(
    private readonly _entityCatalogService: EntityCatalogService,
    private readonly _logger: LoggerService,
  ) {}

  /**
   * Reads the saved CSV, converts it to an Excel workbook, and highlights flying fields:
   * - UUID present, fields empty → UUID cell red
   * - Data fields present, UUID missing → data cells yellow
   * - Unknown column headers and data cells → orange
   */
  public async generate(csvPath: string, result: ProcessResult, unknownColumns: string[]): Promise<Buffer> {
    this._logger.info(
      `ProcessReportService.generate — building report from "${csvPath}" with ${result.flyingFields.length} flying-field set(s) and ${unknownColumns.length} unknown column(s)`,
      'app-workflow',
    );
    const flyingCellMap = this._buildFlyingCellMap(result.flyingFields);
    const workbook = new ExcelJS.Workbook();
    const sheet = await workbook.csv.readFile(csvPath);

    const headerColMap = this._buildHeaderColMap(sheet);
    this._applyHighlights(sheet, flyingCellMap, headerColMap);
    this._applyMissingUuidHighlights(sheet, headerColMap);
    this._applyUnknownColumnHighlights(sheet, unknownColumns, headerColMap);

    sheet.columns.forEach((col) => {
      col.width = 22;
    });
    this._logger.debug(
      `ProcessReportService.generate — workbook ready (${sheet.actualRowCount} rows, ${sheet.actualColumnCount} columns)`,
      'app-workflow',
    );
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  /**
   * Builds a map of Excel row → UUID columns to color red.
   * Only handles rule 1: UUID present, fields empty → UUID cell red.
   */
  private _buildFlyingCellMap(flyingFields: FlyingField[]): FlyingCellMap {
    const configs = this._entityCatalogService.getConfigs();
    const map: FlyingCellMap = new Map();
    flyingFields.forEach(({ entity, rowIndex, isUuidRed }) => {
      if (!isUuidRed) {
        return;
      }
      const excelRow = rowIndex + 2;
      if (!map.has(excelRow)) {
        map.set(excelRow, { redCols: new Set(), yellowCols: new Set() });
      }
      const entityConfig = Object.values(configs).find((c) => c.tableName === entity);
      const columns = entityConfig?.columns as Record<string, FieldConfig> | undefined;
      const uuidCsvHeader = columns?.id?.csvHeader;
      if (uuidCsvHeader) {
        map.get(excelRow)!.redCols.add(uuidCsvHeader);
      }
    });
    return map;
  }

  /** Builds a map of Hebrew CSV column header → 1-based Excel column index from the header row. */
  private _buildHeaderColMap(sheet: ExcelJS.Worksheet): Map<string, number> {
    const headerColMap = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, colIndex) => {
      cell.font = { bold: true };
      headerColMap.set(String(cell.value).trim(), colIndex);
    });
    return headerColMap;
  }

  /** Applies red fills to UUID cells identified in the flying-cell map. */
  private _applyHighlights(
    sheet: ExcelJS.Worksheet,
    flyingCellMap: FlyingCellMap,
    headerColMap: Map<string, number>,
  ): void {
    flyingCellMap.forEach(({ redCols }, excelRowNumber) => {
      const row = sheet.getRow(excelRowNumber);
      redCols.forEach((col) => {
        const colIndex = headerColMap.get(col);
        if (colIndex !== undefined) {
          row.getCell(colIndex).fill = LIGHT_RED_FILL;
        }
      });
    });
  }

  /**
   * Scans every data row: for each entity, if its UUID column is empty but it has non-empty
   * data columns, colors those data columns yellow (rule 2: data present, UUID missing).
   */
  private _applyMissingUuidHighlights(sheet: ExcelJS.Worksheet, headerColMap: Map<string, number>): void {
    const configs = this._entityCatalogService.getConfigs();
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }
      Object.values(configs).forEach((entityConfig) => {
        const columns = entityConfig.columns as Record<string, FieldConfig>;
        const uuidColIndex = headerColMap.get(columns.id?.csvHeader);
        if (!uuidColIndex) {
          return;
        }
        if (row.getCell(uuidColIndex).value) {
          return;
        }

        const dataColumns = Object.values(columns).filter(
          (col) => col.valueType === 'string' || col.valueType === 'bool',
        );
        dataColumns.forEach((col) => {
          const colIndex = headerColMap.get(col.csvHeader);
          if (!colIndex) {
            return;
          }
          const cell = row.getCell(colIndex);
          if (cell.value !== null && cell.value !== '') {
            cell.fill = YELLOW_FILL;
          }
        });
      });
    });
  }

  /** Colors unknown column headers and all their data cells orange. */
  private _applyUnknownColumnHighlights(
    sheet: ExcelJS.Worksheet,
    unknownColumns: string[],
    headerColMap: Map<string, number>,
  ): void {
    unknownColumns.forEach((colName) => {
      const colIndex = headerColMap.get(colName);
      if (colIndex === undefined) {
        return;
      }
      sheet.getColumn(colIndex).eachCell((cell) => {
        cell.fill = ORANGE_FILL;
      });
    });
  }
}
