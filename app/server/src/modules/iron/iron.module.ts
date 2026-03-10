import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IronEntity } from './entities/iron.entity';
import { IronService } from './iron.service';
import { IronController } from './iron.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IronEntity])],
  controllers: [IronController],
  providers: [IronService],
  exports: [IronService],
})
export class IronModule {}
