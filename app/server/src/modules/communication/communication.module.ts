import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationEntity } from './entities/communication.entity';
import { CommunicationService } from './communication.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationEntity])],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
