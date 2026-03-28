import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import * as iconv from 'iconv-lite';
import { basename, extname } from 'path';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { DataProcessorService } from '../data-processor/services/data-processor.service';
import { ProcessReportService } from '../data-processor/services/process-report.service';
import { ParsedRow } from '../data-processor/types/parsed-row.type';
import { DisplayNamesService } from '../display-names/display-names.service';
import { S3Service } from './s3.service';
import { UploadSummary } from './types/upload-summary.type';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;
const S3_UPLOADS_PREFIX = 'uploads/';
const S3_TMP_PREFIX = 'tmp/';
const S3_REPORTS_PREFIX = 'reports/';

// UTF-8 BOM is the byte sequence EF BB BF at the start of the file.
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

@Injectable()
export class FileService {
  private readonly _logger = new Logger(FileService.name);

  public constructor(
    private readonly _httpService: HttpService,
    private readonly _s3Service: S3Service,
    private readonly _dataProcessorService: DataProcessorService,
    private readonly _reportService: ProcessReportService,
    private readonly _displayNamesService: DisplayNamesService,
  ) {}

  /** Full upload pipeline: validate → convert → upload to S3 → parse → process → generate report. */
  public async handleFile(file: Express.Multer.File, username: string): Promise<UploadSummary> {
    this._logger.log(`Upload started — file: ${file?.originalname}, size: ${file?.size ?? 0} bytes, user: ${username}`);
    this._validateUsername(username);
    const csvFile = this._toCsvFile(file);

    // Save the original file (with user-facing display headers) to S3 as the permanent record.
    void this._s3Service.upload(`${S3_UPLOADS_PREFIX}${csvFile.originalname}`, csvFile.buffer);

    // Translate display-name column headers → parser snake_case names before sending to parser.
    const { buffer: translatedBuffer, unknownColumns } = this._translateCsvHeaders(csvFile.buffer);

    // Upload translated CSV to S3 tmp/ — the parser reads directly from there.
    const tmpS3Key = `${S3_TMP_PREFIX}${csvFile.originalname}`;
    await this._s3Service.upload(tmpS3Key, translatedBuffer);

    const parsedRows = await this._sendToParser(tmpS3Key);
    this._logger.log(`Processing ${parsedRows.length} parsed rows — file: ${csvFile.originalname}`);
    const result = await this._dataProcessorService.process(parsedRows, username);

    const reportName = `${basename(csvFile.originalname, '.csv')}_report.xlsx`;
    const reportBuffer = await this._reportService.generate(tmpS3Key, result);
    void this._s3Service.upload(`${S3_REPORTS_PREFIX}${reportName}`, reportBuffer);

    const summary: UploadSummary = {
      conflictIds: result.conflictIds,
      conflictCount: result.conflictCount,
      uploadPercentage: result.uploadPercentage,
      flyingFieldCount: result.flyingFields.reduce((sum, f) => sum + f.redFields.length, 0),
      reportFileName: reportName,
      unknownColumns,
    };
    this._logger.log(`Upload complete — ${summary.uploadPercentage}% uploaded, ${summary.conflictCount} conflicts, ${summary.flyingFieldCount} flying fields`);
    return summary;
  }

  /** Returns the report buffer for the given filename from S3. */
  public async getReport(filename: string): Promise<Buffer> {
    const buffer = await this._s3Service.download(`${S3_REPORTS_PREFIX}${filename}`);
    if (!buffer) {
      throw new NotFoundException(`Report "${filename}" not found`);
    }
    return buffer;
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

  /** Validates the file and converts xlsx/xls to CSV. Returns the file unchanged if already CSV. */
  private _toCsvFile(file: Express.Multer.File): Express.Multer.File {
    this._validateFile(file);
    const ext = extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      return file;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    return { ...file, originalname: `${basename(file.originalname, ext)}.csv`, buffer: Buffer.from(csvContent) };
  }

  /**
   * Decodes a CSV buffer to a string, handling both UTF-8 (with or without BOM)
   * and Windows-1255 (the standard encoding for Hebrew Excel exports).
   */
  private _decodeCsvBuffer(buffer: Buffer): string {
    if (buffer.slice(0, 3).equals(UTF8_BOM)) {
      return buffer.slice(3).toString('utf8');
    }
    // Excel exports Hebrew CSVs as Windows-1255 when saved without explicit UTF-8 encoding.
    return iconv.decode(buffer, 'windows-1255');
  }

  /**
   * Translates display-name column headers in a CSV buffer to the snake_case parser field names.
   * Supports UTF-8 (with or without BOM) and Windows-1255 encoded files.
   * Returns the translated buffer (always UTF-8) and the list of unrecognised column labels.
   */
  private _translateCsvHeaders(buffer: Buffer): { buffer: Buffer; unknownColumns: string[] } {
    const csv = this._decodeCsvBuffer(buffer);

    const newlineIndex = csv.indexOf('\n');
    if (newlineIndex === -1) {
      return { buffer: Buffer.from(csv, 'utf8'), unknownColumns: [] };
    }

    const labelMap = this._displayNamesService.buildLabelToParserFieldMap();
    const headerLine = csv.slice(0, newlineIndex).replace(/\r$/, '');
    const rest = csv.slice(newlineIndex);

    const unknownColumns: string[] = [];
    const translatedHeaders = headerLine
      .split(',')
      .map((header, index) => {
        const normalized = header
          .trim()
          .replace(/^"|"$/g, '')
          .replace(/""/g, '"');
        const translated = labelMap.get(normalized);
        if (!translated) {
          this._logger.warn(`CSV column ${index + 1} not found in display-names config — received: "${normalized}"`);
          unknownColumns.push(normalized);
        }
        return translated ?? normalized;
      })
      .join(',');

    return { buffer: Buffer.from(translatedHeaders + rest, 'utf8'), unknownColumns };
  }

  /** Sends the S3 key to the parser service and returns the structured parsed rows. */
  private async _sendToParser(s3Key: string): Promise<ParsedRow[]> {
    this._logger.log(`Sending to parser: ${s3Key}`);
    const start = Date.now();
    const { data } = await firstValueFrom(
      this._httpService.post<ParsedRow[]>(process.env.PARSER_URL!, { path: s3Key }),
    ).catch((err) => {
      this._logger.error(`Parser request failed: ${err?.message ?? err}`);
      throw new InternalServerErrorException('Parser service failed to process the file');
    });
    this._logger.log(`Parser returned ${data.length} rows in ${Date.now() - start}ms`);
    return data;
  }
}
