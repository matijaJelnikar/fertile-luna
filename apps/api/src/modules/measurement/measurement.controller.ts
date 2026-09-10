import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { CreateMeasurementRequestDto } from './dto/create-measurement.dto';
import { UpdateMeasurementRequestDto } from './dto/update-measurement.dto';
import { MeasurementService } from './measurement.service';

@ApiBearerAuth()
@ApiTags('measurement')
@Controller('measurement')
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  // Create a new measurement
  @Post('add/:cycleId')
  async add(
    @Param('cycleId', ParseUUIDPipe) cycleUuid: UUID,
    @Body() addMeasurementDto: CreateMeasurementRequestDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.createMeasurement(
      addMeasurementDto,
      cycleUuid,
      req.user.uuid
    );
  }

  // Get all measurements for a specific cycle
  @Get('getAll/:cycleId')
  async getAll(
    @Param('cycleId', ParseUUIDPipe) cycleUuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.getMeasurementsByCycle(
      cycleUuid,
      req.user.uuid
    );
  }

  // Get a specific measurement by ID
  @Get(':uuid')
  async getOne(
    @Param('uuid', ParseUUIDPipe) uuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.getMeasurementById(uuid, req.user.uuid);
  }

  // Update a specific measurement by ID
  @Put(':uuid')
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: UUID,
    @Body() updateMeasurementDto: UpdateMeasurementRequestDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.updateMeasurement(
      uuid,
      updateMeasurementDto,
      req.user.uuid
    );
  }

  // Delete a specific measurement by ID
  @Delete(':uuid')
  async delete(
    @Param('uuid', ParseUUIDPipe) uuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.deleteMeasurement(uuid, req.user.uuid);
  }
}
