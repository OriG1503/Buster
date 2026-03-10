import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageEntity } from './entities/storage.entity';
import { StorageRepository } from './storage.repository';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([StorageEntity])],
  providers: [StorageRepository, StorageService],
  exports: [StorageRepository, StorageService],
})
export class StorageModule {}
