import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictRepository } from './conflict.repository';
import { ConflictService } from './conflict.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConflictEntity])],
  providers: [ConflictRepository, ConflictService],
  exports: [ConflictRepository, ConflictService],
})
export class ConflictModule {}
