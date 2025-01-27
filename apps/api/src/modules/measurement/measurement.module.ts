import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measurement } from '../../entities/measurement.entity';
import { User } from '../../entities/user.entity';
import { UsersService } from '../users/users.service';
import { MeasurementController } from './measurement.controller';
import { MeasurementService } from './measurement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Measurement, User])],
  controllers: [MeasurementController],
  providers: [MeasurementService, UsersService],
})
export class MeasurementModule {}
