import {
  MeasurementDto,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import { BadRequestException, Injectable } from '@nestjs/common';
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

  // Create a new measurement
  async createMeasurement(
    measurementData: MeasurementDto,
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<Partial<Measurement>> {
    const cycle = await this.cycleService.findOneById(cycleUuid, userUuid);
    if (!cycle) {
      throw new BadRequestException('Cycle not found');
    }

    const newMeasurement = this.measurementRepository.create({
      ...measurementData,
      cycle: cycle,
    });

    const savedMeasurement = await this.measurementRepository.save(
      newMeasurement
    );

    // Exclude cycle field from response
    const { cycle: _, ...measurementResponse } = savedMeasurement;
    return measurementResponse;
  }

  // Get all measurements by cycle
  async getMeasurementsByCycle(
    cycleUuid: UUID
  ): Promise<Partial<Measurement>[]> {
    const measurements = await this.measurementRepository.find({
      where: { cycle: { uuid: cycleUuid } },
    });

    return measurements.map((measurement) => ({
      ...measurement,
    }));
  }

  // Get a specific measurement by ID
  async getMeasurementById(uuid: UUID): Promise<Partial<Measurement>> {
    const measurement = await this.measurementRepository.findOne({
      where: { uuid },
    });
    if (!measurement) {
      throw new BadRequestException('Measurement not found');
    }

    return measurement;
  }

  // Update a specific measurement
  async updateMeasurement(
    uuid: UUID,
    updateMeasurementDto: UpdateMeasurementDto
  ): Promise<Partial<Measurement>> {
    const measurement = await this.measurementRepository.findOne({
      where: { uuid: uuid },
    });
    if (!measurement) {
      throw new BadRequestException('Measurement not found');
    }

    const updatedMeasurement = Object.assign(measurement, updateMeasurementDto);
    await this.measurementRepository.save(updatedMeasurement);

    return updatedMeasurement;
  }

  // Delete a specific measurement by ID
  async deleteMeasurement(uuid: UUID): Promise<void> {
    const measurement = await this.measurementRepository.findOne({
      where: { uuid },
    });
    if (!measurement) {
      throw new BadRequestException('Measurement not found');
    }

    await this.measurementRepository.remove(measurement);
  }
}
