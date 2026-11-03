import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import {
  FabComponent,
  TemperaturesChartComponent,
} from '@basal-temp-log-workspace/components';
import {
  MeasurementDto,
  MeasurementGraphData,
  phaseOnDay,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import { filter, switchMap } from 'rxjs';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
} from '../../components/add-measurement/add-measurement.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { toCycleDay } from '../../state/measurements/cycle-day';
import { CycleService } from '../../state/measurements/cycle.service';
import { FertilityService } from '../../state/fertility/fertility.service';
import { evaluationContextFor } from '../../state/fertility/life-phase';
import { HomeService } from './home.service';
import { UserService } from '../../state/user/user.service';
import { LocalStorageService } from '../../services/local-storage.service';
import {
  MOBILE_DIALOG_CONFIG,
  StorageKeys,
} from '../../shared/constants/common.constants';
import { DayCardComponent } from './day-card/day-card.component';
import { HomeViewStateService } from './home-view-state.service';

const roundedAverage = (values: (number | null)[]): number | null => {
  const counted = values.filter(
    (value): value is number => value !== null && value > 0
  );
  if (counted.length === 0) return null;
  return Math.round(counted.reduce((sum, v) => sum + v, 0) / counted.length);
};

@Component({
  selector: 'app-home',
  imports: [
    DatePipe,
    DayCardComponent,
    FabComponent,
    TemperaturesChartComponent,
    MatIconButton,
    MatIcon,
    TranslatePipe,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeService],
})
export class HomeComponent {
  private dialog = inject(MatDialog);
  private storage = inject(LocalStorageService);
  private viewState = inject(HomeViewStateService);
  private chart = viewChild(TemperaturesChartComponent);
  homeService = inject(HomeService);

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

  currentCycle = computed(() => this.homeService.currentCycle());
  currentCycleNumber = computed(() => this.currentCycle()?.cycleNumber ?? 1);
  dayOfCycle = computed(() =>
    toCycleDay(new Date(), this.currentCycle()?.startDate)
  );

  /** The last day of a closed cycle; an open cycle has none yet. */
  cycleEnd = computed(() => {
    const cycle = this.currentCycle();
    if (!cycle?.length) return null;
    const end = new Date(cycle.startDate);
    end.setDate(end.getDate() + cycle.length - 1);
    return end;
  });

  private cycleIndex = computed(() =>
    this.cycleService
      .cycles()
      .findIndex((c) => c.uuid === this.cycleService.currentCycleUuid())
  );
  hasPrevious = computed(
    () => this.cycleIndex() < this.cycleService.cycles().length - 1
  );
  hasNext = computed(() => this.cycleIndex() > 0);
  isLatestCycle = computed(() => this.cycleIndex() === 0);

  /** The earliest first raised temperature day across every cycle with a confirmed shift. */
  earliestFirstRaisedDay = computed(() => {
    const cycles = this.cycleService.cycles();
    const stoppedOn = this.userService.contraceptionStoppedOn();
    const days = this.homeService.history().flatMap(({ cycle, entries }) => {
      const { temperature } = this.fertilityService.evaluate(
        entries,
        [],
        evaluationContextFor(cycle, cycles, stoppedOn)
      );
      const first =
        temperature.status === 'satisfied'
          ? temperature.result.countedDays[0]
          : undefined;
      return first === undefined ? [] : [first];
    });
    return days.length ? Math.min(...days) : null;
  });

  // Only closed cycles have a length; the open one has not finished yet.
  avgCycleLength = computed(() =>
    roundedAverage(
      this.cycleService.cyclesWithDerived().map((cycle) => cycle.length)
    )
  );

  avgBleedingLength = computed(() =>
    roundedAverage(
      this.cycleService.cyclesWithDerived().map((cycle) => cycle.bleedingLength)
    )
  );

  showAllRows = signal(
    this.storage.getItem(StorageKeys.CHART_ALL_ROWS) === true
  );

  /** Kept per cycle, so another cycle opens on its own last day and a page switch keeps the choice. */
  selectedDay = computed(() =>
    this.viewState.dayIn(this.cycleService.currentCycleUuid())
  );

  /** Where the sheet was scrolled when the page was left; read once as it is drawn. */
  initialChartScroll = this.viewState.chartScrollIn(
    this.cycleService.currentCycleUuid()
  );

  private lastRecordedDay = computed(() =>
    this.homeService
      .placedMeasurements()
      .reduce((max, entry) => Math.max(max, entry.day ?? 0), 0)
  );

  /**
   * How far the day arrows go: the last recorded day, or today in the open cycle so an empty today
   * can be reached; a closed cycle ends on its last day.
   */
  lastNavigableDay = computed(() => {
    const cycle = this.currentCycle();
    const end = this.isLatestCycle() ? this.dayOfCycle() : cycle?.length;
    return Math.max(this.lastRecordedDay(), end ?? 0);
  });

  /** The day the card shows: the chosen one, or the sheet's own default, the last recorded. */
  shownDay = computed(
    () => this.selectedDay() ?? (this.lastRecordedDay() || null)
  );

  shownEntry = computed(
    () =>
      this.homeService
        .placedMeasurements()
        .find((entry) => entry.day === this.shownDay()) ?? null
  );

  /** Past the last recorded day nothing is said: marking days ahead would be a prediction. */
  shownPhase = computed(() => {
    const day = this.shownDay();
    if (day === null || day > this.lastRecordedDay()) return null;
    return phaseOnDay(this.evaluation(), day) ?? 'unevaluable';
  });

  /** Whether this cycle is the first after stopping hormonal contraception (`#R-LIFE-02`). */
  private evaluationContext = computed(() =>
    evaluationContextFor(
      this.currentCycle(),
      this.cycleService.cycles(),
      this.userService.contraceptionStoppedOn()
    )
  );

  evaluation = computed(() =>
    // TODO: pass the prior cycles' entries — until this screen loads them, R-FIRST-01 and R-FIRST-02
    // report insufficient history for every cycle.
    this.fertilityService.evaluate(
      this.homeService.measurements(),
      [],
      this.evaluationContext()
    )
  );

  constructor() {
    effect(() =>
      this.storage.setItem(StorageKeys.CHART_ALL_ROWS, this.showAllRows())
    );

    inject(DestroyRef).onDestroy(() => {
      const cycleUuid = this.cycleService.currentCycleUuid();
      const chart = this.chart();
      if (cycleUuid && chart) {
        this.viewState.saveChartScroll(cycleUuid, chart.scrollOffset());
      }
    });
  }

  selectDay(day: number | null): void {
    const cycleUuid = this.cycleService.currentCycleUuid();
    if (cycleUuid && day !== null) this.viewState.selectDay(cycleUuid, day);
  }

  /** Past either end of a cycle the arrows carry on into the neighbouring one. */
  stepDay(delta: -1 | 1): void {
    const day = this.shownDay() ?? 0;
    const next = day + delta;
    if (next >= 1 && next <= this.lastNavigableDay()) {
      this.selectDay(next);
      return;
    }

    // `cycles()` runs newest first; the derived list runs oldest first, so look up by uuid.
    const cycles = this.cycleService.cycles();
    const index = this.cycleIndex();
    if (delta === 1 && this.hasNext()) {
      const newer = cycles[index - 1];
      this.cycleService.setCurrentCycle(newer.uuid);
      this.viewState.selectDay(newer.uuid, 1);
    } else if (delta === -1 && this.hasPrevious()) {
      const olderUuid = cycles[index + 1].uuid;
      const older = this.cycleService
        .cyclesWithDerived()
        .find((cycle) => cycle.uuid === olderUuid);
      this.cycleService.setCurrentCycle(olderUuid);
      // A closed cycle ends on its length; without one the sheet opens on its last recorded day.
      if (older?.length) this.viewState.selectDay(olderUuid, older.length);
    }
  }

  previousCycle(): void {
    const cycles = this.cycleService.cycles();
    if (this.hasPrevious()) {
      this.cycleService.setCurrentCycle(cycles[this.cycleIndex() + 1].uuid);
    }
  }

  nextCycle(): void {
    const cycles = this.cycleService.cycles();
    if (this.hasNext()) {
      this.cycleService.setCurrentCycle(cycles[this.cycleIndex() - 1].uuid);
    }
  }

  addRecord(date: Date = new Date()): void {
    const data: MeasurementDialogData = {
      mode: 'create',
      measurement: { date },
      cycleStartDate: this.currentCycle()?.startDate ?? null,
      // Given to the form so choosing a day that already has an entry opens it for editing
      // instead of starting a second one.
      existingEntries: this.homeService.measurements(),
    };

    this.dialog
      .open(AddMeasurementComponent, { ...MOBILE_DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(
        filter((result): result is MeasurementDto => !!result),
        // May offer to start a new cycle on the day, when it records menstrual bleeding.
        switchMap((result) => this.homeService.record(result))
      )
      .subscribe({
        // The error only — never the entry, which is health data.
        error: (err: unknown) =>
          console.error('Error adding measurement:', err),
      });
  }

  editDay(entry: MeasurementGraphData): void {
    const data: MeasurementDialogData = {
      mode: 'edit',
      measurement: entry,
      cycleStartDate: this.currentCycle()?.startDate ?? null,
    };

    this.dialog
      .open(AddMeasurementComponent, { ...MOBILE_DIALOG_CONFIG, data })
      .afterClosed()
      .pipe(
        filter((changes): changes is UpdateMeasurementDto => !!changes),
        switchMap((changes) => this.homeService.update(entry.uuid, changes))
      )
      .subscribe({
        error: (err: unknown) =>
          console.error('Error updating measurement:', err),
      });
  }
}
