import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measurement } from '../../entities/measurement.entity';
import { CycleModule } from '../cycle/cycle.module';
import { MeasurementController } from './measurement.controller';
import { MeasurementService } from './measurement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Measurement]), CycleModule],
  controllers: [MeasurementController],
  providers: [MeasurementService],
})
export class MeasurementModule {}
