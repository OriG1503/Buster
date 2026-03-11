import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RobotEntity } from './entities/robot.entity';
import { RobotRepository } from './robot.repository';
import { RobotService } from './robot.service';

@Module({
  imports: [TypeOrmModule.forFeature([RobotEntity])],
  providers: [RobotRepository, RobotService],
  exports: [RobotRepository, RobotService],
})
export class RobotModule {}
