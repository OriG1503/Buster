import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RobotEntity } from './entities/robot.entity';
import { RobotService } from './robot.service';

@Module({
  imports: [TypeOrmModule.forFeature([RobotEntity])],
  providers: [RobotService],
  exports: [RobotService],
})
export class RobotModule {}
