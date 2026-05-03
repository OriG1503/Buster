import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoggerService } from '../../shared/services/logger/logger.service';
import { FileService } from './file.service';
import { UploadSummary } from './types/upload-summary.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { Role } from '../auth/types/role.type';

@Controller('file')
export class FileController {
  public constructor(
    private readonly _fileService: FileService,
    private readonly _logger: LoggerService,
  ) {}

  @RequireRole(Role.UPLOADER)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<UploadSummary> {
    //LOG
    this._logger.info(
      `FileController.upload — POST /api/file received for user "${user.email}", filename "${file?.originalname}"`,
      'app-workflow',
    );
    return this._fileService.handleFile(file, user.email);
  }

  @Public()
  @Get('report/:filename')
  public async downloadReport(@Param('filename') filename: string, @Res() res: Response): Promise<void> {
    //LOG
    this._logger.info(`FileController.downloadReport — GET /api/file/report/${filename}`, 'app-workflow');
    const buffer = await this._fileService.getReport(filename);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.send(buffer);
    //LOG
    this._logger.info(
      `FileController.downloadReport — report "${filename}" sent (${buffer.length} bytes)`,
      'app-workflow',
    );
  }
}
