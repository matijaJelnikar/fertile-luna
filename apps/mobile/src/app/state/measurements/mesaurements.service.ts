import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
  Measurement,
  MeasurementDto,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { tap } from 'rxjs/operators';
import { MeasurementEndpoints } from '../../shared/constants/endpoints.constants';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  measurements = signal<MeasurementGraphData[]>([]);

  constructor(private http: HttpClient) {}

  getMeasurementsByCycle(cycleId: string, cycleStartDate?: Date) {
    return this.http
      .get<Measurement[]>(`${MeasurementEndpoints.GET_MEASUREMENT}/${cycleId}`)
      .pipe(
        tap((measurements) => {
          const graphData = measurements.map((m) => {
            const measurementDate = new Date(m.date);
            let day = 1;

            if (cycleStartDate) {
              const startDate = new Date(cycleStartDate);
              const diffTime = measurementDate.getTime() - startDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              day = diffDays + 1; // +1 because first day is day 1
            }

            return {
              day: day,
              date: measurementDate,
              temperature: m.temperature,
            };
          });
          this.measurements.set(graphData);
        })
      );
  }

  getMeasurement(measurementId: string) {
    return this.http.get<Measurement>(
      `${MeasurementEndpoints.GET_ONE_MEASUREMENT}/${measurementId}`
    );
  }

  addMeasurement(
    cycleId: string,
    measurementData: MeasurementDto,
    cycleStartDate?: Date
  ) {
    return this.http
      .post<Measurement>(
        `${MeasurementEndpoints.ADD_MEASUREMENT}/${cycleId}`,
        measurementData
      )
      .pipe(
        tap((newMeasurement) => {
          const measurementDate = new Date(newMeasurement.date);
          let day = 1;

          if (cycleStartDate) {
            const startDate = new Date(cycleStartDate);
            const diffTime = measurementDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            day = diffDays + 1;
          }

          this.measurements.update((measurements) => {
            return [
              ...measurements,
              {
                day: day,
                date: measurementDate,
                temperature: newMeasurement.temperature,
              },
            ];
          });
        })
      );
  }

  updateMeasurement(
    measurementId: string,
    measurementData: Partial<MeasurementDto>
  ) {
    return this.http.put<Measurement>(
      `${MeasurementEndpoints.UPDATE_MEASUREMENT}/${measurementId}`,
      measurementData
    );
  }

  deleteMeasurement(measurementId: string) {
    return this.http.delete(
      `${MeasurementEndpoints.DELETE_MEASUREMENT}/${measurementId}`
    );
  }
}
