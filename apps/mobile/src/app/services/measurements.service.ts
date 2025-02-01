import { Injectable } from '@angular/core';
import { MeasurementGraphData } from '@basal-temp-log-workspace/model';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  measurements: MeasurementGraphData[] = [];

  init(): void {
    this.measurements = this.getMeasurementsMock();
  }

  getMeasurementsMock(): MeasurementGraphData[] {
    const _measurements: MeasurementGraphData[] = [];

    for (let index = 1; index < 28; index++) {
      _measurements.push({
        temperature: this.getRandomTemperature(),
        day: index,
        date: new Date(),
      });
    }
    return _measurements;
  }

  getRandomTemperature(min = 36.5, max = 37.1): number {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  }
}
