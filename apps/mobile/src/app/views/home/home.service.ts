import { Injectable } from '@angular/core';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { MeasurementsService } from '../../services/measurements.service';

@Injectable()
export class HomeService {
  measurements: MeasurementDto[] = [];
  constructor(private measurementsService: MeasurementsService) {}

  init(): void {
    this.measurements = this.measurementsService.getMeasurementsMock();
  }
}
