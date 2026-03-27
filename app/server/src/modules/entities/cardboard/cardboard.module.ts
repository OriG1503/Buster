import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardboardEntity } from './entities/cardboard.entity';
import { CardboardRepository } from './cardboard.repository';
import { CardboardService } from './cardboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([CardboardEntity])],
  providers: [CardboardRepository, CardboardService],
  exports: [CardboardRepository, CardboardService],
})
export class CardboardModule {}
