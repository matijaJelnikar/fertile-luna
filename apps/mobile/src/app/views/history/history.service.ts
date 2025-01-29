import { Injectable } from '@angular/core';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { MeasurementsService } from '../../services/measurements.service';

@Injectable()
export class HistoryService {
  measurements: MeasurementDto[] = [];
  constructor(private measurementsService: MeasurementsService) {}

  initHistory(): void {
    this.measurements = this.measurementsService.getMeasurementsMock();
  }
}
