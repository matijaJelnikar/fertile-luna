import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MeasurementsService } from './state/measurements/mesaurements.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private translateService = inject(TranslateService);

  title = '';
  measurementsService = inject(MeasurementsService);
  // Constructed here so the stored theme is applied before the first view renders.
  private theme = inject(ThemeService);

  ngOnInit(): void {
    this.title = this.translateService.instant('app.name');
  }
}
