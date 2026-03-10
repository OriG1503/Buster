import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictService } from './conflict.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConflictEntity])],
  providers: [ConflictService],
  exports: [ConflictService],
})
export class ConflictModule {}
