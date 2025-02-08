import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { MeasurementGraphData } from '@basal-temp-log-workspace/model';
import { tap } from 'rxjs/operators';
import { MeasurementEndpoints } from '../../shared/constants/endpoints.constants';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  measurements = signal<MeasurementGraphData[]>([]);

  constructor(private http: HttpClient) {}

  getMeasurements() {
    this.http
      .get<MeasurementGraphData[]>(MeasurementEndpoints.GET_MEASUREMENT)
      .pipe(
        tap((measurements) => {
          this.measurements.set(measurements);
        })
      )
      .subscribe();
  }

  addMeasurement(measurementData: MeasurementGraphData) {
    return this.http
      .post<MeasurementGraphData>(
        MeasurementEndpoints.ADD_MEASUREMENT,
        measurementData
      )
      .pipe(
        tap((newMeasurement) => {
          this.measurements.update((measurements) => {
            return [...measurements, newMeasurement];
          });
        })
      );
  }
}
