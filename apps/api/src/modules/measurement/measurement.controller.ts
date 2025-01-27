import { Controller } from '@nestjs/common';
import { MeasurementService } from './measurement.service';

@Controller('measurement')
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  //   @UseGuards(JwtGuard)
  //   @Post()
  //   create(
  //     @Body() createMeasurementDto: CreateMeasurementDto,
  //     @Req() req: AuthenticatedRequest
  //   ) {
  //     return this.measurementService.createMeasurement(
  //       createMeasurementDto,
  //       req.user
  //     );
  //   }

  //   @UseGuards(JwtGuard)
  //   @Get()
  //   getAll(@Req() req: AuthenticatedRequest) {
  //     return this.measurementService.getMeasurementsByUser(req.user);
  //   }
}
