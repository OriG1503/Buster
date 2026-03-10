import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IronEntity } from './entities/iron.entity';
import { IronService } from './iron.service';

@Module({
  imports: [TypeOrmModule.forFeature([IronEntity])],
  providers: [IronService],
  exports: [IronService],
})
export class IronModule {}
