import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MatError,
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import {
  MatStep,
  MatStepLabel,
  MatStepper,
  MatStepperNext,
  MatStepperPrevious,
} from '@angular/material/stepper';
import { MatToolbar } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { CycleService } from '../../../state/measurements/cycle.service';
import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';
import { UserDto } from '../registration/registration.component';

export interface CompleteProfileDto {
  username: string;
  birthDate: Date;
  weight: number;
}

interface ProfileModel {
  username: string;
  birthDate: Date | null;
  weight: number | null;
}

interface FirstCycleModel {
  lastPeriodDate: Date | null;
  bleedingLength: number | null;
}

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    FormField,
    FormRoot,
    TranslatePipe,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatError,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatStep,
    MatStepLabel,
    MatStepper,
    MatStepperNext,
    MatStepperPrevious,
    MatSuffix,
    MatToolbar,
  ],
})
export class CompleteProfileComponent {
  private authService = inject(AuthenticationService);
  private credentialService = inject(CredentialsService);
  private cycleService = inject(CycleService);
  private router = inject(Router);

  isLinear = false;

  private profile = signal<ProfileModel>({
    username: '',
    birthDate: null,
    weight: null,
  });
  profileForm = form(this.profile, (path) => {
    required(path.username);
    required(path.birthDate);
  });

  private firstCycle = signal<FirstCycleModel>({
    lastPeriodDate: null,
    bleedingLength: null,
  });
  cycleForm = form(this.firstCycle, (path) => {
    required(path.lastPeriodDate);
    required(path.bleedingLength);
  });

  canSubmit = computed(
    () => this.profileForm().valid() && this.cycleForm().valid()
  );

  submit(): void {
    if (!this.canSubmit()) return;

    const profile = this.profile();
    const firstCycle = this.firstCycle();

    const user: Partial<UserDto> = {
      email: this.credentialService.credentials?.email,
      username: profile.username,
      birthDate: profile.birthDate as Date,
      weight: profile.weight ?? undefined,
    };

    const cycle: CycleDto = {
      cycleNumber: 1,
      startDate: firstCycle.lastPeriodDate as Date,
      bleedingLength: firstCycle.bleedingLength as number,
    };

    forkJoin({
      user: this.authService.updateUser(user),
      cycle: this.cycleService.addCycle(cycle),
    }).subscribe({
      next: () => {
        const currentCredentials = this.credentialService.credentials;
        if (currentCredentials) {
          this.credentialService.setCredentials(
            { ...currentCredentials, profileIncomplete: false },
            true
          );
        }
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Error completing profile:', err);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
