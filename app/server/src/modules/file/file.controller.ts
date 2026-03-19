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
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('file')
export class FileController {
  public constructor(private readonly _fileService: FileService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public async upload(@UploadedFile() file: Express.Multer.File, @Body() { username }: UploadFileDto): Promise<UploadSummary> {
    return this._fileService.handleFile(file, username);
  }
}
