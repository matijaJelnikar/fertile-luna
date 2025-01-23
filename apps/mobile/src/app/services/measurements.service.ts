import { Injectable } from '@angular/core';
import { AddMeasurementModel } from '@basal-temp-log-workspace/model';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  measurements: AddMeasurementModel[] = [];

  init(): void {
    this.measurements = this.getMeasurementsMock();
  }

  getMeasurementsMock(): AddMeasurementModel[] {
    const _measurements: AddMeasurementModel[] = [];
    const today = new Date();

    for (let index = 0; index < 50; index++) {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - index);

      _measurements.push({
        temperature: this.getRandomTemperature(),
        date: pastDate,
      });
    }
    return _measurements;
  }

  getRandomTemperature(min = 36.5, max = 37.1): number {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  }
}
