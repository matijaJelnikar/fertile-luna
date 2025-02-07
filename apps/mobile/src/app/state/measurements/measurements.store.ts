import { Injectable } from '@angular/core';
import { MeasurementGraphData } from '@basal-temp-log-workspace/model';
import { Store, StoreConfig } from '@datorama/akita';

export interface MeasurementsState {
  measurements: MeasurementGraphData[];
}

export function createInitialState(): MeasurementsState {
  return {
    measurements: [],
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'measurements' })
export class MeasurementsStore extends Store<MeasurementsState> {
  constructor() {
    super(createInitialState());
  }

  updateMeasurements(measurements: MeasurementGraphData[]) {
    this.update({ measurements });
  }

  addMeasurement(measurement: MeasurementGraphData) {
    const currentMeasurements = this.getValue().measurements;
    this.update({ measurements: [...currentMeasurements, measurement] });
  }
}
