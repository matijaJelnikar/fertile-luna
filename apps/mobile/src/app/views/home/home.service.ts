import { computed, inject, Injectable } from '@angular/core';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';

@Injectable()
export class HomeService {
  measurementService = inject(MeasurementsService);
  cycleService = inject(CycleService);

  measurements = computed(() => this.measurementService.measurements());

  placedMeasurements = computed(() =>
    this.measurementService.placedMeasurements()
  );

  currentCycle = computed(() => {
    return this.cycleService.currentCycle();
  });

  addMeasurement(data: MeasurementDto) {
    const cycleId = this.cycleService.currentCycleUuid();
    const currentCycle = this.cycleService.currentCycle();
    if (!cycleId || !currentCycle) {
      console.error('No current cycle selected');
      return;
    }
    return this.measurementService.addMeasurement(
      cycleId,
      data,
      currentCycle.startDate
    );
  }
}
