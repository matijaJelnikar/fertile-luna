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

  temperatureData = computed<number[]>(() => {
    return this.homeService.measurements().map((item) => item.temperature);
  });
  timestampData = computed<string[]>(() => {
    return this.homeService
      .measurements()
      .map((item) => new Date(item.date).toLocaleDateString());
  });

  currentCycleNumber = 1;

  constructor(private dialog: MatDialog, private homeService: HomeService) {}

  ngOnInit(): void {
    this.measurementsService.getMeasurements();
    //maybe delete
  }

  previousCycle(): void {}
  nextCycle(): void {}
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
      this.homeService.addMeasurement(result);
    });
  }
}
