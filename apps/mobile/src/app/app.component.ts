import { DOCUMENT } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from './services/local-storage.service';
import { StorageKeys } from './shared/constants/common.constants';
import { MeasurementsService } from './state/measurements/mesaurements.service';
@Component({
  standalone: true,
  imports: [RouterModule, TranslateModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = '';
  document = inject(DOCUMENT);
  measurementsService = inject(MeasurementsService);

  constructor(
    private translateService: TranslateService,
    private localStorageService: LocalStorageService
  ) {
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
  }
  ngOnInit(): void {
    this.title = this.translateService.instant('app.name');
    this.setTheme();
    this.measurementsService.getMeasurements();
  }

  setTheme(): void {
    const storedTheme = this.localStorageService.getItem(StorageKeys.DARK_MODE);
    const isDarkMode =
      storedTheme !== null
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      this.document.body.classList.add('dark');
    }
  }
}
