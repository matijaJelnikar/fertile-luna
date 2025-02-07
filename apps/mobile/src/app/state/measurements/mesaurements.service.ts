import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MeasurementGraphData } from '@basal-temp-log-workspace/model';
import { tap } from 'rxjs/operators';
import { MeasurementEndpoints } from '../../shared/constants/endpoints.constants';
import { MeasurementsStore } from './measurements.store';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  constructor(
    private measurementsStore: MeasurementsStore,
    private http: HttpClient
  ) {}

  getMeasurements() {
    this.http
      .get<MeasurementGraphData[]>(MeasurementEndpoints.GET_MEASUREMENT)
      .pipe(
        tap((measurements) => {
          this.measurementsStore.updateMeasurements(measurements);
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
          this.measurementsStore.addMeasurement(newMeasurement);
        })
      );
  }
}
