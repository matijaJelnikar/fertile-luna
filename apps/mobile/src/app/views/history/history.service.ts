import { computed, inject, Injectable } from '@angular/core';
import { UpdateMeasurementDto } from '@basal-temp-log-workspace/model';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';

@Injectable()
export class HistoryService {
  private measurementService = inject(MeasurementsService);
  private cycleService = inject(CycleService);

  measurements = computed(() => this.measurementService.measurements());

  updateMeasurement(measurementUuid: string, changes: UpdateMeasurementDto) {
    return this.measurementService.updateMeasurement(
      measurementUuid,
      changes,
      this.cycleService.currentCycle()?.startDate
    );
  }

  deleteMeasurement(measurementUuid: string) {
    return this.measurementService.deleteMeasurement(measurementUuid);
  }
}
