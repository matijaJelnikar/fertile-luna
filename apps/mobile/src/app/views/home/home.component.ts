import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FabComponent,
  TemperaturesChartComponent,
} from '@basal-temp-log-workspace/components';
import { CycleDto, MeasurementDto } from '@basal-temp-log-workspace/model';
import { AddMeasurementComponent } from '../../components/add-measurement/add-measurement.component';
import { NewCycleComponent } from '../../components/new-cycle/new-cycle.component';
import { MaterialModule } from '../../material.module';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';
import { FertilityService } from '../../state/fertility/fertility.service';
import { HomeService } from './home.service';

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
export class HomeComponent implements OnInit {
  measurementsService = inject(MeasurementsService);
  cycleService = inject(CycleService);
  fertilityService = inject(FertilityService);

  temperatureData = computed<number[]>(() => {
    return this.homeService.measurements().map((item) => item.temperature);
  });
  timestampData = computed<string[]>(() => {
    return this.homeService
      .measurements()
      .map((item, index) => String(item.day ?? index + 1));
  });

  currentCycle = computed(() => this.homeService.currentCycle());
  currentCycleNumber = computed(() => this.currentCycle()?.cycleNumber ?? 1);
  dayOfCycle = computed(() => {
    const measurements = this.homeService.measurements();
    if (measurements.length === 0) return 0;
    const last = measurements[measurements.length - 1];
    return last.day ?? measurements.length;
  });

  fertilityAssessment = computed(() =>
    this.fertilityService.calculateFertility(this.homeService.measurements())
  );

  isLatestCycle = computed(() => {
    const cycles = this.cycleService.cycles();
    if (cycles.length === 0) return false;
    return cycles[0].uuid === this.cycleService.currentCycleUuid();
  });

  lastMeasurement = computed(() => {
    const measurements = this.homeService.measurements();
    return measurements.length > 0 ? measurements[measurements.length - 1] : null;
  });

  lastMeasurementHasSigns = computed(() => {
    const m = this.lastMeasurement();
    return !!(m?.mucusAppearance || m?.mucusFeeling || m?.cervixPosition || m?.bleeding || m?.intercourse);
  });

  tempShiftMeasurement = computed(() => {
    const shiftDay = this.currentCycle()?.firstHigherTemp;
    if (shiftDay == null) return null;
    return this.homeService.measurements().find((m) => m.day === shiftDay) ?? null;
  });

  firstEverTempShift = computed(() => {
    const cycles = this.cycleService.cycles();
    if (cycles.length <= 1) return null;
    // cycles[0] is newest, cycles[last] is oldest — find oldest with a shift recorded
    for (let i = cycles.length - 1; i >= 0; i--) {
      if (cycles[i].firstHigherTemp != null) return cycles[i];
    }
    return null;
  });

  constructor(private dialog: MatDialog, public homeService: HomeService) {}

  ngOnInit(): void {
    this.cycleService.getCycles().subscribe({
      next: () => {
        const currentCycleId = this.cycleService.currentCycleUuid();
        const currentCycle = this.cycleService.currentCycle();
        if (currentCycleId && currentCycle) {
          this.measurementsService
            .getMeasurementsByCycle(currentCycleId, currentCycle.startDate)
            .subscribe({
              error: (err) => {
                console.error('Error loading measurements:', err);
              }
            });
        }
      },
      error: (err) => {
        console.error('Error loading cycles:', err);
      },
    });
  }

  previousCycle(): void {
    const cycles = this.cycleService.cycles();
    const currentId = this.cycleService.currentCycleUuid();
    const currentIndex = cycles.findIndex((c) => c.uuid === currentId);

    if (currentIndex < cycles.length - 1) {
      const previousCycle = cycles[currentIndex + 1];
      this.cycleService.setCurrentCycle(previousCycle.uuid);
      this.measurementsService
        .getMeasurementsByCycle(previousCycle.uuid, previousCycle.startDate)
        .subscribe();
    }
  }

  nextCycle(): void {
    const cycles = this.cycleService.cycles();
    const currentId = this.cycleService.currentCycleUuid();
    const currentIndex = cycles.findIndex((c) => c.uuid === currentId);

    if (currentIndex > 0) {
      const nextCycle = cycles[currentIndex - 1];
      this.cycleService.setCurrentCycle(nextCycle.uuid);
      this.measurementsService
        .getMeasurementsByCycle(nextCycle.uuid, nextCycle.startDate)
        .subscribe();
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

    dialogRef.afterClosed().subscribe((result: Pick<CycleDto, 'startDate' | 'bleedingLength'> | undefined) => {
      if (!result) return;
      const currentCycle = this.cycleService.currentCycle();
      if (!currentCycle) return;

      const newStartDate = new Date(result.startDate);
      const oldStartDate = new Date(currentCycle.startDate);
      const diffMs = newStartDate.getTime() - oldStartDate.getTime();
      const cycleLength = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (cycleLength > 0) {
        this.cycleService.updateCycle(currentCycle.uuid, { cycleLength }).subscribe();
      }

      const newCycleData: CycleDto = {
        startDate: result.startDate,
        bleedingLength: result.bleedingLength,
        cycleNumber: (currentCycle.cycleNumber ?? 1) + 1,
      };

      this.cycleService.addCycle(newCycleData).subscribe({
        next: (newCycle) => {
          this.measurementsService
            .getMeasurementsByCycle(newCycle.uuid, newCycle.startDate)
            .subscribe();
        },
      });
    });
  }

  addRecord(): void {
    const data: Partial<MeasurementDto> = { date: new Date() };

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
