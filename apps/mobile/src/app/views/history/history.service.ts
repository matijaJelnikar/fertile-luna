import { computed, inject, Injectable } from '@angular/core';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';

@Injectable()
export class HistoryService {
  measurementService = inject(MeasurementsService);
  measurements = computed(() => {
    return this.measurementService.measurements();
  });
}
