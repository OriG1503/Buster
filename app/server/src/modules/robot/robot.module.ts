import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RobotEntity } from './entities/robot.entity';
import { RobotService } from './robot.service';
import { RobotController } from './robot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RobotEntity])],
  controllers: [RobotController],
  providers: [RobotService],
  exports: [RobotService],
})
export class RobotModule {}
