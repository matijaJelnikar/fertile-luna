import {
  MeasurementDto,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UUID } from 'crypto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { MeasurementService } from './measurement.service';

@Controller('measurement')
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  // Create a new measurement
  @UseGuards(JwtGuard)
  @Post('add/:cycleId')
  async add(
    @Param('cycleId') cycleUuid: UUID,
    @Body() addMeasurementDto: MeasurementDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.createMeasurement(
      addMeasurementDto,
      cycleUuid,
      req.user.uuid
    );
  }

  // Get all measurements for a specific cycle
  @UseGuards(JwtGuard)
  @Get('getAll/:cycleId')
  async getAll(@Param('cycleId') cycleUuid: UUID) {
    return this.measurementService.getMeasurementsByCycle(cycleUuid);
  }

  // Get a specific measurement by ID
  @UseGuards(JwtGuard)
  @Get(':uuid')
  async getOne(@Param('uuid') uuid: UUID) {
    return this.measurementService.getMeasurementById(uuid);
  }

  // Update a specific measurement by ID
  @UseGuards(JwtGuard)
  @Put(':uuid')
  async update(
    @Param('uuid') uuid: UUID,
    @Body() updateMeasurementDto: UpdateMeasurementDto
  ) {
    return this.measurementService.updateMeasurement(
      uuid,
      updateMeasurementDto
    );
  }

  // Delete a specific measurement by ID
  @UseGuards(JwtGuard)
  @Delete(':uuid')
  async delete(@Param('uuid') uuid: UUID) {
    return this.measurementService.deleteMeasurement(uuid);
  }
}
