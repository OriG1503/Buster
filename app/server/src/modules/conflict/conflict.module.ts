import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictEntity } from './entities/conflict.entity';
import { ConflictService } from './conflict.service';
import { ConflictController } from './conflict.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConflictEntity])],
  controllers: [ConflictController],
  providers: [ConflictService],
  exports: [ConflictService],
})
export class ConflictModule {}
