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
    this.measurements.set([
      { day: 1, date: new Date('2025-04-01T06:02:00'), temperature: 36.45 },
      { day: 2, date: new Date('2025-04-02T06:05:00'), temperature: 36.48 },
      { day: 3, date: new Date('2025-04-03T06:03:00'), temperature: 36.44 },
      { day: 4, date: new Date('2025-04-04T06:07:00'), temperature: 36.5 },
      { day: 5, date: new Date('2025-04-05T06:01:00'), temperature: 36.47 },
      { day: 6, date: new Date('2025-04-06T06:08:00'), temperature: 36.46 },
      { day: 7, date: new Date('2025-04-07T06:04:00'), temperature: 36.5 },
      { day: 8, date: new Date('2025-04-08T06:09:00'), temperature: 36.52 },
      { day: 9, date: new Date('2025-04-09T06:06:00'), temperature: 36.53 },
      { day: 10, date: new Date('2025-04-10T06:00:00'), temperature: 36.5 },
      { day: 11, date: new Date('2025-04-11T06:02:00'), temperature: 36.51 },
      { day: 12, date: new Date('2025-04-12T06:05:00'), temperature: 36.54 },
      { day: 13, date: new Date('2025-04-13T06:03:00'), temperature: 36.5 },
      { day: 14, date: new Date('2025-04-14T06:07:00'), temperature: 36.55 },
      { day: 15, date: new Date('2025-04-15T06:01:00'), temperature: 36.53 },

      // After ovulation - rise
      { day: 16, date: new Date('2025-04-16T06:04:00'), temperature: 37.0 },
      { day: 17, date: new Date('2025-04-17T06:09:00'), temperature: 36.95 },
      { day: 18, date: new Date('2025-04-18T06:06:00'), temperature: 36.95 },
      { day: 19, date: new Date('2025-04-19T06:00:00'), temperature: 36.72 },
      { day: 20, date: new Date('2025-04-20T06:02:00'), temperature: 36.75 },
      { day: 21, date: new Date('2025-04-21T06:05:00'), temperature: 36.78 },
      { day: 22, date: new Date('2025-04-22T06:03:00'), temperature: 36.8 },
      { day: 23, date: new Date('2025-04-23T06:07:00'), temperature: 36.82 },
      { day: 24, date: new Date('2025-04-24T06:01:00'), temperature: 36.83 },
    ]);

    // this.http
    //   .get<MeasurementGraphData[]>(MeasurementEndpoints.GET_MEASUREMENT)
    //   .pipe(
    //     tap((measurements) => {
    //       this.measurements.set([
    //         { day: 1, date: new Date('2025-04-01'), temperature: 36.4 },
    //         { day: 2, date: new Date('2025-04-02'), temperature: 36.45 },
    //         { day: 3, date: new Date('2025-04-03'), temperature: 36.5 },
    //         { day: 4, date: new Date('2025-04-04'), temperature: 36.48 },
    //         { day: 5, date: new Date('2025-04-05'), temperature: 36.47 },
    //         { day: 6, date: new Date('2025-04-06'), temperature: 36.5 },
    //         { day: 7, date: new Date('2025-04-07'), temperature: 36.52 },
    //         { day: 8, date: new Date('2025-04-08'), temperature: 36.55 },
    //         { day: 9, date: new Date('2025-04-09'), temperature: 36.6 },
    //         { day: 10, date: new Date('2025-04-10'), temperature: 36.7 },
    //         { day: 11, date: new Date('2025-04-11'), temperature: 36.75 },
    //         { day: 12, date: new Date('2025-04-12'), temperature: 36.85 },
    //         { day: 13, date: new Date('2025-04-13'), temperature: 36.9 },
    //         { day: 14, date: new Date('2025-04-14'), temperature: 36.95 },
    //         { day: 15, date: new Date('2025-04-15'), temperature: 37.0 },
    //       ]);
    //     })
    //   )
    //   .subscribe();
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
