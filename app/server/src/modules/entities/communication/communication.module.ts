import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationEntity } from './entities/communication.entity';
import { CommunicationRepository } from './communication.repository';
import { CommunicationService } from './communication.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationEntity])],
  providers: [CommunicationRepository, CommunicationService],
  exports: [CommunicationRepository, CommunicationService],
})
export class CommunicationModule {}
