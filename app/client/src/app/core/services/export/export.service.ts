import { inject, Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

import { DisplayNamesService } from '../display-names/display-names.service';
import { FK_TO_ENTITY_ID } from '../../../shared/consts/fk-to-entity-id.consts';
import { TableRow } from '../../../shared/types/table-view-response.type';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly _displayNames = inject(DisplayNamesService);

  /** Exports selected rows (by index) to an Excel file named after the table. */
  public exportToExcel(allRows: TableRow[], selectedIndices: Set<number>, selectedColumns: string[], tableName: string): void {
    const displayCols = this._filterDisplayColumns(selectedColumns);
    const rows = allRows.filter((_, i) => selectedIndices.has(i));
    const headers = displayCols.map((col) => this._displayNames.getColumnLabelByKey(col));
    const dataRows = rows.map((row) => displayCols.map((col) => row[col]?.value ?? ''));
    this._writeExcelFile([headers, ...dataRows], tableName);
  }

  /** Removes hidden FK id columns (when the FK column itself is already shown). */
  private _filterDisplayColumns(cols: string[]): string[] {
    return cols.filter((col) => {
      if (!col.endsWith('.id')) { return true; }
      const fkKey = FK_TO_ENTITY_ID[col];
      return !(fkKey && cols.includes(fkKey));
    });
  }

  private _writeExcelFile(data: string[][], sheetName: string): void {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  }
}
