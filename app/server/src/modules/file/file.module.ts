import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DataProcessorModule } from '../data-processor/data-processor.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { S3Service } from './s3.service';

@Module({
  imports: [HttpModule, DataProcessorModule],
  controllers: [FileController],
  providers: [FileService, S3Service],
})
export class FileModule {}
