import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FabComponent } from '@basal-temp-log-workspace/components';
import { AddMeasurementModel } from '@basal-temp-log-workspace/model';
import { AddMeasurementComponent } from '../../components/add-measurement/add-measurement.component';
import { HomeService } from './home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FabComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [HomeService],
})
export class HomeComponent implements OnInit {
  constructor(private dialog: MatDialog, private homeService: HomeService) {}

  ngOnInit(): void {
    this.homeService.init();
  }

  addRecord(): void {
    const data: Partial<AddMeasurementModel> = { date: new Date() };

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
