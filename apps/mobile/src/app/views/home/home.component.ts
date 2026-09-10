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
import { CycleDto } from '@basal-temp-log-workspace/model';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
} from '../../components/add-measurement/add-measurement.component';
import { NewCycleComponent } from '../../components/new-cycle/new-cycle.component';
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

  // Greeting
  greeting = computed(() => {
    const name = this.userService.username();
    return name ? `Hey, ${name}` : 'Hey there';
  });

  // Computed signals from home service
  private charted = computed(() =>
    this.homeService
      .placedMeasurements()
      .filter((item) => item.temperature !== undefined)
  );

  temperatureData = computed<number[]>(() =>
    this.charted().map((item) => item.temperature as number)
  );
  timestampData = computed<string[]>(() =>
    this.charted().map((item) => String(item.day))
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

  fertilityAssessment = computed(() =>
    this.fertilityService.calculateFertility(this.homeService.measurements())
  );

  isLatestCycle = computed(() => {
    const cycles = this.cycleService.cycles();
    if (cycles.length === 0) return false;
    return cycles[0].uuid === this.cycleService.currentCycleUuid();
  });


  // The shift is the evaluation's output, never a stored field.
  tempShift = computed(() => {
    const range = this.fertilityAssessment().helperLineRange;
    if (!range) return null;
    return this.charted()[range[1]] ?? null;
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

  startNewCycle(): void {
    const dialogRef = this.dialog.open(NewCycleComponent, {
      width: '90%',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',
      panelClass: 'mobile-dialog',
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: Pick<CycleDto, 'startDate' | 'bleedingLength'> | undefined) => {
          if (!result) return;
          // Starting the new cycle closes the previous one; nothing is written to it.
          this.cycleService.startNewCycle(result).subscribe();
        }
      );
  }

  addRecord(): void {
    const data: MeasurementDialogData = {
      mode: 'create',
      measurement: { date: new Date() },
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

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const addMeasurement$ = this.homeService.addMeasurement(result);
        if (addMeasurement$) {
          addMeasurement$.subscribe({
            next: () => {
              console.log('Measurement added successfully');
            },
            error: (err) => {
              console.error('Error adding measurement:', err);
            },
          });
        }
      }
    });
  }
}
