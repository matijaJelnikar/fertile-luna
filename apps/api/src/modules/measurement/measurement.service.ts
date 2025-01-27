import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Repository } from 'typeorm';
import { CreateMeasurementDto } from '../../dto/create-measurement.dto';
import { Measurement } from '../../entities/measurement.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MeasurementService {
  constructor(
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>,
    private readonly usersService: UsersService
  ) {}

  async createMeasurement(
    measurementData: CreateMeasurementDto,
    userId: UUID
  ): Promise<Partial<Measurement>> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newMeasurement = this.measurementRepository.create({
      ...measurementData,
      user,
    });

    const savedMeasurement = await this.measurementRepository.save(
      newMeasurement
    );

    // Exclude user field from response
    const { user: _, ...measurementResponse } = savedMeasurement;
    return measurementResponse;
  }

  async getMeasurementsByUser(userId: UUID): Promise<Partial<Measurement>[]> {
    const measurements = await this.measurementRepository.find({
      where: { user: { id: userId } },
    });

    return measurements.map((measurement) => ({
      id: measurement.id,
      date: measurement.date,
      temperature: measurement.temperature,
      notes: measurement.notes,
    }));
  }
}
