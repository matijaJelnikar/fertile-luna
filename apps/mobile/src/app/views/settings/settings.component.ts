import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { Cycle, CYCLE_GOALS, CycleGoal } from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { NewCycleDialogService } from '../../components/new-cycle/new-cycle-dialog.service';
import { MatButton } from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MatFormField,
  MatHint,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../state/user/user.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    TranslatePipe,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormField,
    MatHint,
    MatIcon,
    MatInput,
    MatLabel,
    MatRadioButton,
    MatRadioGroup,
    MatSlideToggle,
    MatSuffix,
  ],
})
export class SettingsComponent {
  private theme = inject(ThemeService);
  private user = inject(UserService);
  private newCycleDialog = inject(NewCycleDialogService);
  private router = inject(Router);

  /** The service owns the theme; this screen only offers the switch. */
  readonly isDarkMode = this.theme.isDark;

  /** The stored calendar day, as local midnight for the picker. */
  readonly contraceptionStoppedOn = computed(() => {
    const day = this.user.contraceptionStoppedOn();
    return day ? new Date(`${day.slice(0, 10)}T00:00:00`) : null;
  });

  /** `'none'` stands for no goal: a radio option cannot carry `null` reliably. */
  readonly goals = ['none', ...CYCLE_GOALS] as const;
  readonly goal = computed(() => this.user.goal() ?? 'none');

  onGoalChange(goal: CycleGoal | 'none'): void {
    this.user.setGoal(goal === 'none' ? null : goal).subscribe();
  }

  onDarkModeChange(isDark: boolean): void {
    this.theme.set(isDark);
  }

  onContraceptionStoppedOnChange(date: Date | null): void {
    this.user.setContraceptionStoppedOn(date).subscribe();
  }

  /** Starts a cycle by hand, then shows it — the new cycle is selected on the home screen. */
  startNewCycle(): void {
    this.newCycleDialog
      .start()
      .pipe(filter((cycle): cycle is Cycle => cycle !== null))
      .subscribe(() => this.router.navigate(['/home']));
  }
}
