import { computed, inject, Injectable } from '@angular/core';
import { CycleWithDerived, MeasurementDto } from '@basal-temp-log-workspace/model';
import { Observable, switchMap, tap, throwError } from 'rxjs';
import { NewCycleDialogService } from '../../components/new-cycle/new-cycle-dialog.service';
import { cycleContaining, offersNewCycle } from '../../state/measurements/cycle-start';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';

@Injectable()
export class HomeService {
  measurementService = inject(MeasurementsService);
  cycleService = inject(CycleService);
  private newCycleDialog = inject(NewCycleDialogService);

  measurements = computed(() => this.measurementService.measurements());

  placedMeasurements = computed(() =>
    this.measurementService.placedMeasurements()
  );

  currentCycle = computed(() => {
    return this.cycleService.currentCycle();
  });

  /**
   * Saves a day in the cycle its date falls in — whichever cycle is on screen, since a day recorded
   * in the wrong cycle is evaluated against the wrong start.
   *
   * Menstrual bleeding after the open cycle's own bleeding offers to start a new cycle on that day
   * (`#R-CYCLE-01`): confirmed, the day is filed in the new cycle as its day 1; declined, it stays
   * where its date put it.
   */
  record(entry: MeasurementDto): Observable<unknown> {
    const shown = this.cycleService.currentCycle();
    const target = cycleContaining(entry.date, this.cycleService.cyclesWithDerived()) ?? shown;
    if (!target) {
      return throwError(() => new Error('No cycle to record the day in'));
    }

    // Only the cycle on screen has its entries loaded; for another, its recorded length decides.
    const entries = target.uuid === shown?.uuid ? this.measurementService.measurements() : [];
    if (!offersNewCycle(entry, target, entries)) {
      return this.save(entry, target);
    }

    return this.newCycleDialog.start(entry.date).pipe(
      switchMap((started) =>
        started
          ? this.measurementService.addMeasurement(started.uuid, entry, started.startDate).pipe(
              // Selecting the new cycle fetches its entries on its own, and that fetch can land
              // before this write — so read the cycle again once the day is stored.
              switchMap(() =>
                this.measurementService.getMeasurementsByCycle(started.uuid, started.startDate)
              )
            )
          : this.save(entry, target)
      )
    );
  }

  /** Stores the day; when its cycle is not the one on screen, shows that cycle once it is stored. */
  private save(entry: MeasurementDto, cycle: CycleWithDerived): Observable<unknown> {
    const stored = this.measurementService.addMeasurement(cycle.uuid, entry, cycle.startDate);
    return cycle.uuid === this.cycleService.currentCycleUuid()
      ? stored
      : stored.pipe(tap(() => this.cycleService.setCurrentCycle(cycle.uuid)));
  }
}
