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
import { UpdateMeasurementRequestDto } from './dto/update-measurement.dto';

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
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<Partial<Measurement>[]> {
    const measurements = await this.measurementRepository.find({
      where: { cycle: { uuid: cycleUuid, user: { uuid: userUuid } } },
    });

    return measurements.map((measurement) => this.toResponse(measurement));
  }

  // Get a specific measurement by ID
  async getMeasurementById(
    uuid: UUID,
    userUuid: UUID
  ): Promise<Partial<Measurement>> {
    return this.toResponse(await this.findOwnedMeasurement(uuid, userUuid));
  }

  // Update a specific measurement
  async updateMeasurement(
    uuid: UUID,
    updateMeasurementDto: UpdateMeasurementRequestDto,
    userUuid: UUID
  ): Promise<Partial<Measurement>> {
    const measurement = await this.findOwnedMeasurement(uuid, userUuid);

    // `null` values are written through so the client can clear an observation.
    const updatedMeasurement = Object.assign(measurement, updateMeasurementDto);
    await this.measurementRepository.save(updatedMeasurement);

    return this.toResponse(updatedMeasurement);
  }

  // Delete a specific measurement by ID
  async deleteMeasurement(uuid: UUID, userUuid: UUID): Promise<void> {
    const measurement = await this.findOwnedMeasurement(uuid, userUuid);

    await this.measurementRepository.remove(measurement);
  }

  // Every lookup is scoped through the owning cycle's user, so a measurement uuid
  // alone is never enough to reach another user's data.
  private async findOwnedMeasurement(
    uuid: UUID,
    userUuid: UUID
  ): Promise<Measurement> {
    const measurement = await this.measurementRepository.findOne({
      where: { uuid, cycle: { user: { uuid: userUuid } } },
    });
    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    return measurement;
  }

  // Filtering on `cycle.user` joins the relation, which would otherwise carry the
  // owner (and their password hash) into the response.
  private toResponse(measurement: Measurement): Partial<Measurement> {
    const { cycle: _cycle, ...measurementResponse } = measurement;
    return measurementResponse;
  }
}
