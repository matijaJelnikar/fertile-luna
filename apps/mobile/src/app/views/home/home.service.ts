import { computed, inject, Injectable } from '@angular/core';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { MeasurementsQuery } from '../../state/measurements/measurements.query';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';

@Injectable()
export class HomeService {
  measurementQuery = inject(MeasurementsQuery);
  measurementsService = inject(MeasurementsService);
  measurements = computed(() => {
    return this.measurementQuery.measurements() || [];
  });

  addMeasurement(data: MeasurementDto): void {
    this.measurementsService.addMeasurement(data).subscribe();
  }
}
