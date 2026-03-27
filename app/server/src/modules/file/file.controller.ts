import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { UploadSummary } from './types/upload-summary.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtPayload, Role } from '../auth/types/role.type';

@Controller('file')
export class FileController {
  public constructor(private readonly _fileService: FileService) {}

  @RequireRole(Role.UPLOADER)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<UploadSummary> {
    return this._fileService.handleFile(file, user.email);
  }

  @Public()
  @Get('report/:filename')
  public async downloadReport(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this._fileService.getReport(filename);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.send(buffer);
  }
}
