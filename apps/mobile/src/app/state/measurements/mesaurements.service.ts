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
          const graphData = measurements
            .map((m) => {
              const measurementDate = new Date(m.date);
              let day = 1;

              if (cycleStartDate) {
                // Create new Date instances for calculation to avoid mutation
                const startDateCalc = new Date(cycleStartDate);
                const measurementDateCalc = new Date(m.date);

                // Reset time portion to midnight for accurate day calculation
                startDateCalc.setHours(0, 0, 0, 0);
                measurementDateCalc.setHours(0, 0, 0, 0);

                const diffTime = measurementDateCalc.getTime() - startDateCalc.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                day = diffDays + 1; // +1 because first day is day 1
              }

              return {
                ...m,
                day: day,
                date: measurementDate,
              };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date
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
            // Create new Date instances for calculation to avoid mutation
            const startDateCalc = new Date(cycleStartDate);
            const measurementDateCalc = new Date(newMeasurement.date);

            // Reset time portion to midnight for accurate day calculation
            startDateCalc.setHours(0, 0, 0, 0);
            measurementDateCalc.setHours(0, 0, 0, 0);

            const diffTime = measurementDateCalc.getTime() - startDateCalc.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            day = diffDays + 1;
          }

          this.measurements.update((measurements) => {
            return [
              ...measurements,
              {
                ...newMeasurement,
                day: day,
                date: measurementDate,
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
