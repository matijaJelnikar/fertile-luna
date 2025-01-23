import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MeasurementsService } from './services/measurements.service';
@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'mobile';

  measurementsService = inject(MeasurementsService);

  ngOnInit(): void {
    this.measurementsService.init();
  }
}
