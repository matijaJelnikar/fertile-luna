import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { MeasurementService } from './measurement.service';

@Controller('measurement')
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @UseGuards(JwtGuard)
  @Post('add')
  add(
    @Body() addMeasurementDto: MeasurementDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.measurementService.createMeasurement(
      addMeasurementDto,
      req.user.uuid
    );
  }

  @UseGuards(JwtGuard)
  @Get('getAll')
  getAll(@Req() req: AuthenticatedRequest) {
    return this.measurementService.getMeasurementsByUser(req.user.uuid);
  }
}
