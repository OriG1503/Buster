import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardboardEntity } from './entities/cardboard.entity';
import { CardboardService } from './cardboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([CardboardEntity])],
  providers: [CardboardService],
  exports: [CardboardService],
})
export class CardboardModule {}
