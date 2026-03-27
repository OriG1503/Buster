import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IronEntity } from './entities/iron.entity';
import { IronRepository } from './iron.repository';
import { IronService } from './iron.service';

@Module({
  imports: [TypeOrmModule.forFeature([IronEntity])],
  providers: [IronRepository, IronService],
  exports: [IronRepository, IronService],
})
export class IronModule {}
