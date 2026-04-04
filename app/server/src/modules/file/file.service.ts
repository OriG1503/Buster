import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import * as iconv from 'iconv-lite';
import { basename, extname } from 'path';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { DataProcessorService } from '../data-processor/services/data-processor.service';
import { ProcessReportService } from '../data-processor/services/process-report.service';
import { ParsedRow } from '../data-processor/types/parsed-row.type';
import { EntityCatalogService } from '../entity-catalog/entity-catalog.service';
import { ACCEPTED_EXTENSIONS, UTF8_BOM } from './consts/accepted-extensions.const';
import { TMP_DIR, UPLOADS_DIR, REPORTS_DIR } from './consts/file-storage-paths.const';
import { UploadSummary } from './types/upload-summary.type';

@Injectable()
export class FileService {
  private readonly _logger = new Logger(FileService.name);

  public constructor(
    private readonly _httpService: HttpService,
    private readonly _dataProcessorService: DataProcessorService,
    private readonly _reportService: ProcessReportService,
    private readonly _entityCatalogService: EntityCatalogService,
  ) {}

  /** Full upload pipeline: validate → convert → save locally → parse → process → generate report. */
  public async handleFile(file: Express.Multer.File, username: string): Promise<UploadSummary> {
    file.originalname = this._fixFilename(file.originalname);
    this._logger.log(`Upload started — file: ${file?.originalname}, size: ${file?.size ?? 0} bytes, user: ${username}`);
    this._validateUsername(username);
    const csvFile = this._toCsvFile(file);
    const uploadedFileName = `${UPLOADS_DIR}/${csvFile.originalname}`;

    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(uploadedFileName, csvFile.buffer);

    // Translate display-name column headers → parser snake_case names before sending to parser.
    // Reject the file entirely if any column header is unrecognised — avoids silent 0% uploads.
    const { buffer: translatedBuffer, unknownColumns, totalColumnCount } = this._translateCsvHeaders(csvFile.buffer);
    if (unknownColumns.length > 0) {
      throw new BadRequestException(
        `הקובץ נדחה — ${unknownColumns.length} עמודות לא מזוהות. יש להשתמש בתבנית הרשמית בלבד.`,
      );
    }

    await mkdir(TMP_DIR, { recursive: true });
    const tmpPath = `${TMP_DIR}/${csvFile.originalname}`;
    await writeFile(tmpPath, translatedBuffer);

    const parsedRows = await this._sendToParser(tmpPath);
    this._logger.log(`Processing ${parsedRows.length} parsed rows — file: ${csvFile.originalname}`);
    const result = await this._dataProcessorService.process(parsedRows, username);

    const reportName = `${basename(csvFile.originalname, '.csv')}_report.xlsx`;
    const reportBuffer = await this._reportService.generate(uploadedFileName, result, unknownColumns);
    await mkdir(REPORTS_DIR, { recursive: true });
    await writeFile(`${REPORTS_DIR}/${reportName}`, reportBuffer);

    return this._buildUploadSummary(result, reportName, unknownColumns, totalColumnCount);
  }

  /** Returns the report buffer for the given filename from local storage. */
  public async getReport(filename: string): Promise<Buffer> {
    return readFile(`${REPORTS_DIR}/${filename}`).catch(() => {
      throw new NotFoundException(`Report "${filename}" not found`);
    });
  }

  private _buildUploadSummary(
    result: Awaited<ReturnType<DataProcessorService['process']>>,
    reportName: string,
    unknownColumns: string[],
    totalColumnCount: number,
  ): UploadSummary {
    const flyingFieldCount = result.flyingFields.reduce((sum, f) => sum + f.redFields.length, 0);
    this._logger.log(`Upload complete — ${result.uploadPercentage}% uploaded, ${result.conflictCount} conflicts, ${flyingFieldCount} flying fields`);
    return {
      conflictIds: result.conflictIds,
      conflictCount: result.conflictCount,
      uploadPercentage: result.uploadPercentage,
      flyingFieldCount,
      reportFileName: reportName,
      unknownColumns,
      totalColumnCount,
    };
  }

  /** Throws if the file extension is not in the accepted list. */
  private _validateFile(file: Express.Multer.File): void {
    const ext = extname(file?.originalname ?? '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
      throw new BadRequestException(`File must be one of: ${ACCEPTED_EXTENSIONS.join(', ')}`);
    }
  }

  /** Throws if username is missing or blank. */
  private _validateUsername(username: string): void {
    if (!username?.trim()) {
      throw new BadRequestException('username is required');
    }
  }

  /** Validates and converts xlsx/xls to CSV. Returns the file unchanged if already CSV. */
  private _toCsvFile(file: Express.Multer.File): Express.Multer.File {
    this._validateFile(file);
    const ext = extname(file.originalname).toLowerCase();
    if (ext === '.csv') { return file; }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    return { ...file, originalname: `${basename(file.originalname, ext)}.csv`, buffer: Buffer.from(csvContent) };
  }

  /**
   * Decodes a CSV buffer to a string, handling three cases in priority order:
   * 1. UTF-8 with BOM (Excel "Save as UTF-8 CSV" with BOM)
   * 2. UTF-8 without BOM (xlsx-to-CSV conversion, or modern Excel UTF-8 CSVs)
   * 3. Windows-1255 fallback (standard Hebrew Excel CSV exports)
   */
  private _decodeCsvBuffer(buffer: Buffer): string {
    if (buffer.slice(0, 3).equals(UTF8_BOM)) { return buffer.slice(3).toString('utf8'); }
    const asUtf8 = buffer.toString('utf8');
    if (!asUtf8.includes('\uFFFD')) { return asUtf8; }
    return iconv.decode(buffer, 'windows-1255');
  }

  /**
   * Fixes Hebrew filenames that arrive garbled from multer.
   * Multer decodes multipart Content-Disposition filenames as Latin-1, so UTF-8
   * Hebrew bytes become mojibake (e.g. "××¢××¨××ª" instead of "בעברית").
   * Strategy: re-interpret each char as its Latin-1 byte, decode the resulting
   * byte array as UTF-8. If the result is clean (no replacement chars), the
   * original was Latin-1-misread UTF-8 and we return the corrected string.
   * If the result has replacement chars the name was already correctly decoded —
   * return it unchanged. Pure-ASCII names pass through unaffected.
   */
  private _fixFilename(originalname: string): string {
    const bytes = Buffer.from(originalname, 'latin1');
    const asUtf8 = bytes.toString('utf8');
    return asUtf8.includes('\uFFFD') ? originalname : asUtf8;
  }

  /**
   * Translates display-name column headers in a CSV buffer to the snake_case parser field names.
   * Returns the translated buffer (always UTF-8) and the list of unrecognised column labels.
   */
  private _translateCsvHeaders(buffer: Buffer): { buffer: Buffer; unknownColumns: string[]; totalColumnCount: number } {
    const csv = this._decodeCsvBuffer(buffer);
    const newlineIndex = csv.indexOf('\n');
    if (newlineIndex === -1) { return { buffer: Buffer.from(csv, 'utf8'), unknownColumns: [], totalColumnCount: 0 }; }

    const labelMap = this._entityCatalogService.buildCsvHeaderToParserFieldMap();
    const headerLine = csv.slice(0, newlineIndex).replace(/\r$/, '');
    const rest = csv.slice(newlineIndex);
    const unknownColumns: string[] = [];
    const headers = headerLine.split(',');

    const translatedHeaders = headers
      .map((header, index) => this._translateHeader(header, index, labelMap, unknownColumns))
      .join(',');

    return { buffer: Buffer.from(translatedHeaders + rest, 'utf8'), unknownColumns, totalColumnCount: headers.length };
  }

  private _translateHeader(header: string, index: number, labelMap: Map<string, string>, unknownColumns: string[]): string {
    const normalized = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    const translated = labelMap.get(normalized);
    if (!translated) {
      this._logger.warn(`CSV column ${index + 1} not found in display-names config — received: "${normalized}"`);
      unknownColumns.push(normalized);
    }
    return translated ?? normalized;
  }

  /** Sends the local file path to the parser service and returns the structured parsed rows. */
  private async _sendToParser(localPath: string): Promise<ParsedRow[]> {
    this._logger.log(`Sending to parser: ${localPath}`);
    const start = Date.now();
    const { data } = await firstValueFrom(
      this._httpService.post<ParsedRow[]>(process.env.PARSER_URL!, { path: localPath }),
    ).catch((err) => {
      this._logger.error(`Parser request failed: ${err?.message ?? err}`);
      throw new InternalServerErrorException('Parser service failed to process the file');
    });
    this._logger.log(`Parser returned ${data.length} rows in ${Date.now() - start}ms`);
    return data;
  }
}
