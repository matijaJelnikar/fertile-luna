import { MeasurementDto } from '@basal-temp-log-workspace/model';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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

  @UseGuards(JwtGuard)
  @Get('getAll/:cycleId')
  async getAll(
    @Param('cycleId') cycleUuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.getMeasurementsByCycle(
      cycleUuid,
      req.user.uuid
    );
  }
}
