import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageEntity } from './entities/storage.entity';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StorageEntity])],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
