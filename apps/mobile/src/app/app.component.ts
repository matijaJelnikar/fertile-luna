import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MeasurementsService } from './services/measurements.service';
@Component({
  standalone: true,
  imports: [RouterModule, TranslateModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = '';

  measurementsService = inject(MeasurementsService);

  constructor(private translateService: TranslateService) {
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }
  ngOnInit(): void {
    this.title = this.translateService.instant('app.name');
    this.measurementsService.init();
  }
}
