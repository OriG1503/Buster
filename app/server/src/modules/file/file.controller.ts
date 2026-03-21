import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { UploadSummary } from './types/upload-summary.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRole } from '../auth/decorators/require-role.decorator';
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
}
