import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardboardEntity } from './entities/cardboard.entity';
import { CardboardService } from './cardboard.service';
import { CardboardController } from './cardboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CardboardEntity])],
  controllers: [CardboardController],
  providers: [CardboardService],
  exports: [CardboardService],
})
export class CardboardModule {}
