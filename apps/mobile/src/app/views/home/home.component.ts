import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FabComponent,
  TemperaturesChartComponent,
} from '@basal-temp-log-workspace/components';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { AddMeasurementComponent } from '../../components/add-measurement/add-measurement.component';
import { MaterialModule } from '../../material.module';
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
  temperatureData = signal<number[]>([]);
  timestampData = signal<string[]>([]);
  constructor(private dialog: MatDialog, private homeService: HomeService) {}

  ngOnInit(): void {
    this.homeService.init();
    this.initGraphData();
  }

  initGraphData(): void {
    this.temperatureData.set(
      this.homeService.measurements.map((item) => item.temperature)
    );
    this.timestampData.set(
      this.homeService.measurements.map((item) =>
        new Date(item.date).toLocaleDateString()
      )
    );
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
      //TODO cleanup
    });
  }
}
