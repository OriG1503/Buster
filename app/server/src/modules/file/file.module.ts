import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DataProcessorModule } from '../data-processor/data-processor.module';
import { DisplayNamesModule } from '../display-names/display-names.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [HttpModule, DataProcessorModule, DisplayNamesModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
