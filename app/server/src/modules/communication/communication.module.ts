import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationEntity } from './entities/communication.entity';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationEntity])],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
