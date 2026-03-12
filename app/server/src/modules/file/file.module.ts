import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DataProcessorModule } from '../data-processor/data-processor.module';

@Module({
  imports: [HttpModule, DataProcessorModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
