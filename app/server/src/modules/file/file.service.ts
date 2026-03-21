import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { basename, extname, join } from 'path';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { DataProcessorService } from '../data-processor/services/data-processor.service';
import { ProcessReportService } from '../data-processor/services/process-report.service';
import { ParsedRow } from '../data-processor/types/parsed-row.type';
import { S3Service } from './s3.service';
import { UploadSummary } from './types/upload-summary.type';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

@Injectable()
export class FileService {
  public constructor(
    private readonly _httpService: HttpService,
    private readonly _s3Service: S3Service,
    private readonly _dataProcessorService: DataProcessorService,
    private readonly _reportService: ProcessReportService,
  ) {}

  /** Full upload pipeline: validate → convert → parse → process → generate report. */
  public async handleFile(file: Express.Multer.File, username: string): Promise<UploadSummary> {
    this._validateUsername(username);
    const csvFile = this._toCsvFile(file);

    const tmpCsvPath = join(tmpdir(), csvFile.originalname);
    await fs.writeFile(tmpCsvPath, csvFile.buffer);
    void this._s3Service.upload(csvFile.originalname, csvFile.buffer);

    try {
      const parsedRows = await this._sendToParser(tmpCsvPath);
      const result = await this._dataProcessorService.process(parsedRows, username);

      const reportName = `${basename(csvFile.originalname, '.csv')}_report.xlsx`;
      const reportBuffer = await this._reportService.generate(tmpCsvPath, result);
      void this._s3Service.upload(reportName, reportBuffer);

      return {
        conflictCount: result.conflictCount,
        uploadPercentage: result.uploadPercentage,
        flyingFieldCount: result.flyingFields.reduce((sum, f) => sum + f.fields.length, 0),
        reportFileName: reportName,
      };
    } finally {
      await fs.unlink(tmpCsvPath).catch(() => {});
    }
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

  /** Sends the CSV path to the parser service and returns the structured parsed rows. */
  private async _sendToParser(csvPath: string): Promise<ParsedRow[]> {
    const { data } = await firstValueFrom(
      this._httpService.post<ParsedRow[]>(process.env.PARSER_URL!, { path: csvPath }),
    ).catch(() => { throw new InternalServerErrorException('Parser service failed to process the file'); });
    return data;
  }
}
