import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlasticEntity } from './entities/plastic.entity';
import { PlasticService } from './plastic.service';
import { PlasticController } from './plastic.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlasticEntity])],
  controllers: [PlasticController],
  providers: [PlasticService],
  exports: [PlasticService],
})
export class PlasticModule {}
