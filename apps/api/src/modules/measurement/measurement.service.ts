import { MeasurementDto } from '@basal-temp-log-workspace/model';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Repository } from 'typeorm';
import { Measurement } from '../../entities/measurement.entity';
import { CycleService } from '../cycle/cycle.service';

@Injectable()
export class MeasurementService {
  constructor(
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>,
    private readonly cycleService: CycleService
  ) {}

  async createMeasurement(
    measurementData: MeasurementDto,
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<Partial<Measurement>> {
    // 🔍 Ensure the cycle belongs to the authenticated user
    const cycle = await this.cycleService.findOneById(cycleUuid, userUuid);
    if (!cycle) {
      throw new BadRequestException(
        'Cycle not found or does not belong to user'
      );
    }

    const newMeasurement = this.measurementRepository.create({
      ...measurementData,
      cycle,
    });

    const savedMeasurement = await this.measurementRepository.save(
      newMeasurement
    );

    // ✅ Exclude the cycle field from response
    const { cycle: _, ...measurementResponse } = savedMeasurement;
    return measurementResponse;
  }

  async getMeasurementsByCycle(
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<Partial<Measurement>[]> {
    // 🔍 Ensure the cycle belongs to the authenticated user
    const cycle = await this.cycleService.findOneById(cycleUuid, userUuid);
    if (!cycle) {
      throw new NotFoundException('Cycle not found or does not belong to user');
    }

    const measurements = await this.measurementRepository.find({
      where: { cycle: { uuid: cycleUuid } },
    });

    return measurements.map((measurement) => ({
      ...measurement,
    }));
  }
}
