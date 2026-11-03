import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MeasurementsService } from './state/measurements/mesaurements.service';
import { ThemeService } from './services/theme.service';
@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss',
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
