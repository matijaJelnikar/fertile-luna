import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MaterialModule, FormsModule, TranslateModule],
})
export class SettingsComponent {
  private theme = inject(ThemeService);

  /** The service owns the theme; this screen only offers the switch. */
  readonly isDarkMode = this.theme.isDark;

  onDarkModeChange(isDark: boolean): void {
    this.theme.set(isDark);
  }
}
