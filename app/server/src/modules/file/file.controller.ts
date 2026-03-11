import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  public constructor(private readonly _fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  public async upload(@UploadedFile() file: Express.Multer.File) {
    return this._fileService.handleFile(file);
  }
}
