import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  CycleWithDerived,
  Measurement,
  MeasurementDto,
  MeasurementGraphData,
  PlacedMeasurement,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import { filter, switchMap, tap } from 'rxjs/operators';
import { MeasurementEndpoints } from '../../shared/constants/endpoints.constants';
import { toCycleDay } from './cycle-day';
import { CycleService } from './cycle.service';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  private http = inject(HttpClient);
  private cycleService = inject(CycleService);

  private state = signal<MeasurementGraphData[]>([]);
  readonly measurements = this.state.asReadonly();

  /** Only these are evaluated or charted; the rest have no day to place them on. */
  readonly placedMeasurements = computed(() =>
    this.state().filter((m): m is PlacedMeasurement => m.day !== null)
  );

  readonly unplaceableMeasurements = computed(() =>
    this.state().filter((m) => m.day === null)
  );

  constructor() {
    // Single source of loading: whichever view is opened first, the measurements
    // for the selected cycle follow the cycle selection.
    toObservable(this.cycleService.currentCycle)
      .pipe(
        filter((cycle): cycle is CycleWithDerived => !!cycle),
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
    return { ...measurement, date, day: toCycleDay(date, cycleStartDate) };
  }

  private sortByDate(
    measurements: MeasurementGraphData[]
  ): MeasurementGraphData[] {
    return [...measurements].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }
}
