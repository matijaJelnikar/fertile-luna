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
import { toDateOnly } from '../../utils/date-only';
import { CycleService } from '../cycle/cycle.service';
import { UpdateMeasurementRequestDto } from './dto/update-measurement.dto';

@Injectable()
export class MeasurementService {
  constructor(
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>,
    private readonly cycleService: CycleService
  ) {}

  // A day carries at most one entry, so recording a day that already has one updates it.
  async createMeasurement(
    measurementData: MeasurementDto,
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<Partial<Measurement>> {
    const cycle = await this.cycleService.findOneById(cycleUuid, userUuid);
    if (!cycle) {
      throw new BadRequestException('Cycle not found');
    }

    this.assertDisturbanceHasMeasurement(measurementData);

    const existing = await this.findByDay(cycleUuid, measurementData.date);
    if (existing) {
      // Omitted fields keep their value; clearing goes through the update endpoint's `null`.
      const merged = Object.assign(existing, measurementData);
      return this.toResponse(await this.measurementRepository.save(merged));
    }

    const newMeasurement = this.measurementRepository.create({
      ...measurementData,
      cycle: cycle,
    });

    return this.toResponse(await this.measurementRepository.save(newMeasurement));
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
    this.assertDisturbanceHasMeasurement(updatedMeasurement);
    await this.measurementRepository.save(updatedMeasurement);

    return this.toResponse(updatedMeasurement);
  }

  // Delete a specific measurement by ID
  async deleteMeasurement(uuid: UUID, userUuid: UUID): Promise<void> {
    const measurement = await this.findOwnedMeasurement(uuid, userUuid);

    await this.measurementRepository.remove(measurement);
  }

  private assertDisturbanceHasMeasurement(entry: {
    temperature?: number | null;
    disturbed?: boolean | null;
  }): void {
    if (entry.disturbed && entry.temperature == null) {
      throw new BadRequestException(
        'A day without a temperature cannot be marked as disturbed'
      );
    }
  }

  private async findByDay(
    cycleUuid: UUID,
    date: Date | string
  ): Promise<Measurement | null> {
    return this.measurementRepository
      .createQueryBuilder('measurement')
      .innerJoin('measurement.cycle', 'cycle')
      .where('cycle.uuid = :cycleUuid', { cycleUuid })
      .andWhere('measurement.date = :date', { date: toDateOnly(date) })
      .getOne();
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
