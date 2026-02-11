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
    const cycle = this.currentCycle();
    if (!cycle?.startDate) return 0;

    const today = new Date();
    const startDate = new Date(cycle.startDate);
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 because first day of bleeding is day 1
  });

  fertilityAssessment = computed(() =>
    this.fertilityService.calculateFertility(this.homeService.measurements())
  );

  isLatestCycle = computed(() => {
    const cycles = this.cycleService.cycles();
    if (cycles.length === 0) return false;
    return cycles[0].uuid === this.cycleService.currentCycleUuid();
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
