import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import { DataProcessorService } from '../data-processor/data-processor.service';
import { ParsedRow } from '../data-processor/types/parsed-row.type';

@Injectable()
export class FileService {
  public constructor(
    private readonly _httpService: HttpService,
    private readonly _dataProcessorService: DataProcessorService,
  ) {}

  public async handleFile(file: Express.Multer.File, username: string): Promise<number> {
    this._validateFile(file);
    this._validateUsername(username);
    await this._saveFile(file);

    const parsedRows = await this._sendToParser(file);
    return this._dataProcessorService.process(parsedRows, username);
  }

  private _validateFile(file: Express.Multer.File): void {
    if (!file?.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a .csv');
    }
  }

  private _validateUsername(username: string): void {
    if (!username?.trim()) {
      throw new BadRequestException('username is required');
    }
  }

  private async _saveFile(file: Express.Multer.File): Promise<void> {
    const filesPath = join(__dirname, '../../../../../../files');
    await mkdir(filesPath, { recursive: true });
    await writeFile(join(filesPath, file.originalname), file.buffer);
  }

  private async _sendToParser(file: Express.Multer.File): Promise<ParsedRow[]> {
    const filePath = join(__dirname, '../../../../../../files', file.originalname);
    const { data } = await firstValueFrom(this._httpService.post<ParsedRow[]>(process.env.PARSER_URL!, { path: filePath }));
    return data;
  }
}
