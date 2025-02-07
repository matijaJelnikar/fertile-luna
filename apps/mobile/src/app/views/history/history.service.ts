import { computed, inject, Injectable } from '@angular/core';
import { MeasurementsQuery } from '../../state/measurements/measurements.query';

@Injectable()
export class HistoryService {
  measurementQuery = inject(MeasurementsQuery);
  measurements = computed(() => {
    return this.measurementQuery.measurements();
  });
}
