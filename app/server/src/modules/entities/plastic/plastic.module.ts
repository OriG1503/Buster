import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlasticEntity } from './entities/plastic.entity';
import { PlasticRepository } from './plastic.repository';
import { PlasticService } from './plastic.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlasticEntity])],
  providers: [PlasticRepository, PlasticService],
  exports: [PlasticRepository, PlasticService],
})
export class PlasticModule {}
