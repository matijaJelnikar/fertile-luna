import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FabComponent } from '@basal-temp-log-workspace/components';
import { AddMeasurementComponent } from '../../components/add-measurement/add-measurement.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FabComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(private dialog: MatDialog) {}

  addRecord(): void {
    const dialogRef = this.dialog.open(AddMeasurementComponent, {
      width: '80%',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'mobile-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      //TODO cleanup
    });
  }
}
