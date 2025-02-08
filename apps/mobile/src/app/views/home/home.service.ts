import { computed, inject, Injectable } from '@angular/core';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';

@Injectable()
export class HomeService {
  measurementService = inject(MeasurementsService);
  measurements = computed(() => {
    return this.measurementService.measurements();
  });

  addMeasurement(data: MeasurementDto): void {
    this.measurementService.addMeasurement(data).subscribe();
  }
}
