import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FabComponent,
  TemperaturesChartComponent,
} from '@basal-temp-log-workspace/components';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { filter, switchMap } from 'rxjs';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
} from '../../components/add-measurement/add-measurement.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { toCycleDay } from '../../state/measurements/cycle-day';
import { CycleService } from '../../state/measurements/cycle.service';
import { FertilityService } from '../../state/fertility/fertility.service';
import { HomeService } from './home.service';
import { UserService } from '../../state/user/user.service';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FabComponent,
    TemperaturesChartComponent,
    MaterialModule,
    TranslateModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeService],
})
export class HomeComponent {
  cycleService = inject(CycleService);
  fertilityService = inject(FertilityService);
  userService = inject(UserService);

  private translate = inject(TranslateService);

  greeting = computed(() => {
    const name = this.userService.username();
    return name
      ? this.translate.instant('home.greeting.named', { name })
      : this.translate.instant('home.greeting');
  });

  // Computed signals from home service
  private charted = computed(() =>
    this.homeService
      .placedMeasurements()
      .filter((item) => item.temperature !== undefined)
  );

  currentCycle = computed(() => this.homeService.currentCycle());
  currentCycleNumber = computed(() => this.currentCycle()?.cycleNumber ?? 1);
  dayOfCycle = computed(() =>
    toCycleDay(new Date(), this.currentCycle()?.startDate)
  );

  // Only closed cycles have a length; the open one has not finished yet.
  avgCycleLength = computed(() => {
    const lengths = this.cycleService
      .cyclesWithDerived()
      .map((cycle) => cycle.length)
      .filter((length): length is number => length !== null && length > 0);

    if (lengths.length === 0) return null;
    return Math.round(
      lengths.reduce((sum, length) => sum + length, 0) / lengths.length
    );
  });

  evaluation = computed(() =>
    this.fertilityService.evaluate(this.homeService.measurements())
  );

  /**
   * What the method can say about this cycle right now. A description of method state, never a
   * risk and never advice (`#R-COMBI-01`, `#R-COMBI-02`).
   */
  phaseStateKey = computed(() => {
    const { postOvulatory, temperature, mucus, cervix } = this.evaluation();
    if (postOvulatory.status === 'satisfied') return 'home.phase.infertile.confirmed';
    if (temperature.status === 'satisfied') {
      // Without mucus the cervix is the second sign (`#R-CERVIX-01`), so name the one awaited.
      const unrecorded = (sign: typeof mucus | typeof cervix) =>
        sign.status === 'unevaluable' && sign.missing === 'not-recorded';
      return unrecorded(mucus) && !unrecorded(cervix)
        ? 'home.phase.awaiting.cervix'
        : 'home.phase.awaiting.mucus';
    }
    if (mucus.status === 'satisfied') return 'home.phase.awaiting.temperature';
    return 'home.phase.awaiting.both';
  });

  /** The day the post-ovulatory infertile phase begins, once both signs are in. */
  infertileFromDay = computed(() => {
    const { postOvulatory } = this.evaluation();
    return postOvulatory.status === 'satisfied' ? postOvulatory.result.infertileFromDay : null;
  });

  isLatestCycle = computed(() => {
    const cycles = this.cycleService.cycles();
    if (cycles.length === 0) return false;
    return cycles[0].uuid === this.cycleService.currentCycleUuid();
  });


  // The shift is the evaluation's output, never a stored field.
  tempShift = computed(() => {
    const { temperature } = this.evaluation();
    if (temperature.status !== 'satisfied') return null;
    const { completedOnDay, helperLineTemperature } = temperature.result;
    const day = this.charted().find((entry) => entry.day === completedOnDay) ?? null;
    return day ? { ...day, helperLineTemperature } : null;
  });

  constructor(private dialog: MatDialog, public homeService: HomeService) {}

  previousCycle(): void {
    const cycles = this.cycleService.cycles();
    const currentId = this.cycleService.currentCycleUuid();
    const currentIndex = cycles.findIndex((c) => c.uuid === currentId);

    if (currentIndex < cycles.length - 1) {
      this.cycleService.setCurrentCycle(cycles[currentIndex + 1].uuid);
    }
  }

  nextCycle(): void {
    const cycles = this.cycleService.cycles();
    const currentId = this.cycleService.currentCycleUuid();
    const currentIndex = cycles.findIndex((c) => c.uuid === currentId);

    if (currentIndex > 0) {
      this.cycleService.setCurrentCycle(cycles[currentIndex - 1].uuid);
    }
  }

  addRecord(): void {
    const data: MeasurementDialogData = {
      mode: 'create',
      measurement: { date: new Date() },
      cycleStartDate: this.currentCycle()?.startDate ?? null,
      // Given to the form so choosing a day that already has an entry opens it for editing
      // instead of starting a second one.
      existingEntries: this.homeService.measurements(),
    };

    const dialogRef = this.dialog.open(AddMeasurementComponent, {
      width: '90%',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',
      panelClass: 'mobile-dialog',
      autoFocus: false,
      data: data,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result): result is MeasurementDto => !!result),
        // May offer to start a new cycle on the day, when it records menstrual bleeding.
        switchMap((result) => this.homeService.record(result))
      )
      .subscribe({
        // The error only — never the entry, which is health data.
        error: (err: unknown) => console.error('Error adding measurement:', err),
      });
  }
}
