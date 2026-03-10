import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlasticEntity } from './entities/plastic.entity';
import { PlasticService } from './plastic.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlasticEntity])],
  providers: [PlasticService],
  exports: [PlasticService],
})
export class PlasticModule {}
