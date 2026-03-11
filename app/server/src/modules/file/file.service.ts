import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';

const PARSER_URL = 'http://localhost:8999/parse';

@Injectable()
export class FileService {
  public constructor(private readonly _httpService: HttpService) {}

  public async handleFile(file: Express.Multer.File){
    this._validateFile(file);
    await this._save_file(file);
    
    const parsed_csv = await this._sendToParser(file);
    return parsed_csv
  }

  private _validateFile(file: Express.Multer.File): void {
    if (!file?.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a .csv');
    }
  }

  private async _save_file(file: Express.Multer.File): Promise<void> {
    const files_path = join(__dirname, '../../../../../files');

    await mkdir(files_path, { recursive: true });
    await writeFile(join(files_path, file.originalname), file.buffer);
  }

  private async _sendToParser(file: Express.Multer.File) {
    const filePath = join(__dirname, '../../../../../files', file.originalname);

    const { data } = await firstValueFrom(
      this._httpService.post(PARSER_URL, { path: filePath }),
    );

    return data;
  }
}
