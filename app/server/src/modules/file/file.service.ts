import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename, extname, parse } from 'path';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { DataProcessorService } from '../data-processor/data-processor.service';
import { ProcessReportService } from '../data-processor/process-report.service';
import { ParsedRow } from '../data-processor/types/parsed-row.type';
import { UploadSummary } from './types/upload-summary.type';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;
const FILES_DIR = join(__dirname, '../../../../../../files');

@Injectable()
export class FileService {
  public constructor(
    private readonly _httpService: HttpService,
    private readonly _dataProcessorService: DataProcessorService,
    private readonly _reportService: ProcessReportService,
  ) {}

  public async handleFile(file: Express.Multer.File, username: string): Promise<UploadSummary> {
    this._validateFile(file);
    this._validateUsername(username);

    const csvFile = this._toCsvFile(file);

    await this._saveFile(csvFile).catch(() => {
      throw new InternalServerErrorException('Failed to save the uploaded file');
    });

    const csvPath = join(FILES_DIR, csvFile.originalname);

    const parsedRows = await this._sendToParser(csvFile).catch(() => {
      throw new InternalServerErrorException('Parser service failed to process the file');
    });

    const result = await this._dataProcessorService.process(parsedRows, username).catch(() => {
      throw new InternalServerErrorException('Failed to process the parsed data');
    });

    const reportBuffer = await this._reportService.generate(csvPath, result).catch(() => {
      throw new InternalServerErrorException('Failed to generate the Excel report');
    });

    const reportName = `${basename(csvFile.originalname, '.csv')}_report.xlsx`;
    await writeFile(join(FILES_DIR, reportName), reportBuffer).catch(() => {
      throw new InternalServerErrorException('Failed to save the Excel report');
    });

    return {
      conflictCount: result.conflictCount,
      uploadPercentage: result.uploadPercentage,
      flyingFieldCount: result.flyingFields.reduce((sum, f) => sum + f.fields.length, 0),
      reportFileName: reportName,
    };
  }

  private _validateFile(file: Express.Multer.File): void {
    const ext = extname(file?.originalname ?? '').toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
      throw new BadRequestException(`File must be one of: ${ACCEPTED_EXTENSIONS.join(', ')}`);
    }
  }

  private _validateUsername(username: string): void {
    if (!username?.trim()) {
      throw new BadRequestException('username is required');
    }
  }

  private _toCsvFile(file: Express.Multer.File): Express.Multer.File {
    const ext = extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      return file;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    const csvName = `${basename(file.originalname, ext)}.csv`;

    return { ...file, originalname: csvName, buffer: Buffer.from(csvContent) };
  }

  private async _saveFile(file: Express.Multer.File): Promise<void> {
    await mkdir(FILES_DIR, { recursive: true });
    await writeFile(join(FILES_DIR, file.originalname), file.buffer);
  }

  private async _sendToParser(file: Express.Multer.File): Promise<ParsedRow[]> {
    const filePath = join(FILES_DIR, file.originalname);
    const { data } = await firstValueFrom(this._httpService.post<ParsedRow[]>(process.env.PARSER_URL!, { path: filePath }));
    return data;
  }
}
