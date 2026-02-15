import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, resource } from '@angular/core';
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
import { UserService } from '../../state/user/user.service';
import { firstValueFrom } from 'rxjs';

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
  measurementsService = inject(MeasurementsService);
  cycleService = inject(CycleService);
  fertilityService = inject(FertilityService);
  userService = inject(UserService);

  // Resource for cycles — loads once on component init
  private cyclesResource = resource({
    loader: () => firstValueFrom(this.cycleService.getCycles()),
  });

  // Greeting
  greeting = computed(() => {
    const name = this.userService.username();
    return name ? `Hey, ${name}` : 'Hey there';
  });

  // Computed signals from home service
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

  // Average cycle length from all cycles
  avgCycleLength = computed(() => {
    const cycles = this.cycleService.cycles();
    const withLength = cycles.filter((c) => c.cycleLength != null && c.cycleLength > 0);
    if (withLength.length === 0) return null;
    const total = withLength.reduce((sum, c) => sum + c.cycleLength!, 0);
    return Math.round(total / withLength.length);
  });

  fertilityAssessment = computed(() =>
    this.fertilityService.calculateFertility(this.homeService.measurements())
  );

  isLatestCycle = computed(() => {
    const cycles = this.cycleService.cycles();
    if (cycles.length === 0) return false;
    return cycles[0].uuid === this.cycleService.currentCycleUuid();
  });


  tempShiftMeasurement = computed(() => {
    const shiftDay = this.currentCycle()?.firstHigherTemp;
    if (shiftDay == null) return null;
    return this.homeService.measurements().find((m) => m.day === shiftDay) ?? null;
  });

  // Earliest temperature shift across all cycles
  earliestTempShiftCycle = computed(() => {
    const cycles = this.cycleService.cycles();
    const cyclesWithShift = cycles.filter((c) => c.firstHigherTemp != null);
    if (cyclesWithShift.length === 0) return null;
    return cyclesWithShift.reduce((earliest, c) => {
      const earliestDay = earliest.firstHigherTemp ?? Number.MAX_VALUE;
      const currentDay = c.firstHigherTemp ?? Number.MAX_VALUE;
      return currentDay < earliestDay ? c : earliest;
    });
  });

  constructor(private dialog: MatDialog, public homeService: HomeService) {
    // Load measurements whenever current cycle changes (e.g., during navigation or initial load)
    effect(() => {
      const cycleId = this.cycleService.currentCycleUuid();
      const cycle = this.cycleService.currentCycle();
      if (cycleId && cycle) {
        this.measurementsService
          .getMeasurementsByCycle(cycleId, cycle.startDate)
          .subscribe();
      }
    });
  }

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
