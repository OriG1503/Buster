import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { UploadSummary } from './types/upload-summary.type';

@Controller('file')
export class FileController {
  public constructor(private readonly _fileService: FileService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('username') username: string,
  ): Promise<UploadSummary> {
    return this._fileService.handleFile(file, username);
  }
}
