import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Cycle,
  Measurement,
  MeasurementDto,
  MeasurementGraphData,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import { filter, switchMap, tap } from 'rxjs/operators';
import { MeasurementEndpoints } from '../../shared/constants/endpoints.constants';
import { CycleService } from './cycle.service';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  private http = inject(HttpClient);
  private cycleService = inject(CycleService);

  private state = signal<MeasurementGraphData[]>([]);
  readonly measurements = this.state.asReadonly();

  constructor() {
    // Single source of loading: whichever view is opened first, the measurements
    // for the selected cycle follow the cycle selection.
    toObservable(this.cycleService.currentCycle)
      .pipe(
        filter((cycle): cycle is Cycle => !!cycle),
        switchMap((cycle) =>
          this.getMeasurementsByCycle(cycle.uuid, cycle.startDate)
        ),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  getMeasurementsByCycle(cycleId: string, cycleStartDate?: Date) {
    return this.http
      .get<Measurement[]>(`${MeasurementEndpoints.GET_MEASUREMENT}/${cycleId}`)
      .pipe(
        tap((measurements) => {
          this.state.set(
            this.sortByDate(
              measurements.map((m) => this.toGraphData(m, cycleStartDate))
            )
          );
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
          this.state.update((measurements) =>
            this.sortByDate([
              ...measurements,
              this.toGraphData(newMeasurement, cycleStartDate),
            ])
          );
        })
      );
  }

  updateMeasurement(
    measurementId: string,
    measurementData: UpdateMeasurementDto,
    cycleStartDate?: Date
  ) {
    return this.http
      .put<Measurement>(
        `${MeasurementEndpoints.UPDATE_MEASUREMENT}/${measurementId}`,
        measurementData
      )
      .pipe(
        tap((updatedMeasurement) => {
          this.state.update((measurements) =>
            this.sortByDate(
              measurements.map((measurement) =>
                measurement.uuid === measurementId
                  ? this.toGraphData(updatedMeasurement, cycleStartDate)
                  : measurement
              )
            )
          );
        })
      );
  }

  deleteMeasurement(measurementId: string) {
    return this.http
      .delete(`${MeasurementEndpoints.DELETE_MEASUREMENT}/${measurementId}`)
      .pipe(
        tap(() => {
          this.state.update((measurements) =>
            measurements.filter(
              (measurement) => measurement.uuid !== measurementId
            )
          );
        })
      );
  }

  private toGraphData(
    measurement: Measurement,
    cycleStartDate?: Date
  ): MeasurementGraphData {
    const date = new Date(measurement.date);
    return {
      ...measurement,
      date,
      day: this.calculateCycleDay(date, cycleStartDate),
    };
  }

  private calculateCycleDay(date: Date, cycleStartDate?: Date): number {
    if (!cycleStartDate) return 1;

    // Compare at midnight so a time-of-day difference never shifts the day count.
    const startOfCycle = new Date(cycleStartDate);
    const startOfMeasurement = new Date(date);
    startOfCycle.setHours(0, 0, 0, 0);
    startOfMeasurement.setHours(0, 0, 0, 0);

    const diffTime = startOfMeasurement.getTime() - startOfCycle.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // the cycle start date is day 1
  }

  private sortByDate(
    measurements: MeasurementGraphData[]
  ): MeasurementGraphData[] {
    return [...measurements].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }
}
