import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FabComponent,
  TemperaturesChartComponent,
} from '@basal-temp-log-workspace/components';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { AddMeasurementComponent } from '../../components/add-measurement/add-measurement.component';
import { MaterialModule } from '../../material.module';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';
import { HomeService } from './home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FabComponent,
    TemperaturesChartComponent,
    MaterialModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [HomeService],
})
export class HomeComponent implements OnInit {
  measurementsService = inject(MeasurementsService);
  cycleService = inject(CycleService);

  temperatureData = computed<number[]>(() => {
    return this.homeService.measurements().map((item) => item.temperature);
  });
  timestampData = computed<string[]>(() => {
    return this.homeService
      .measurements()
      .map((item) => new Date(item.date).toLocaleDateString());
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

  constructor(private dialog: MatDialog, private homeService: HomeService) {}

  ngOnInit(): void {
    this.cycleService.getCycles().subscribe({
      next: () => {
        const currentCycleId = this.cycleService.currentCycleUuid();
        const currentCycle = this.cycleService.currentCycle();
        if (currentCycleId && currentCycle) {
          this.measurementsService
            .getMeasurementsByCycle(currentCycleId, currentCycle.startDate)
            .subscribe();
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
