import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { MaterialModule } from '../../../material.module';
import { CycleService } from '../../../state/measurements/cycle.service';
import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';
import { UserDto } from '../registration/registration.component';

export interface CompleteProfileDto {
  username: string;
  birthDate: Date;
  weight: number;
}
@Component({
  standalone: true,
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss'],
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    TranslateModule,
    NgIf,
    RouterModule,
  ],
})
export class CompleteProfileComponent {
  isLinear = false;
  userFormGroup = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    birthDate: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    weight: new FormControl('', {
      validators: [],
    }),
  });
  cycleFormGroup = new FormGroup({
    lastPeriodDate: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    bleedingLength: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  authService = inject(AuthenticationService);
  credentialService = inject(CredentialsService);
  cycleService = inject(CycleService);
  router = inject(Router);

  submit(): void {
    const userFormValue = this.userFormGroup.value;
    const cycleFormValue = this.cycleFormGroup.value;

    const user: Partial<UserDto> = {
      email: this.credentialService.credentials?.email,
      birthDate: userFormValue.birthDate as unknown as Date,
      username: userFormValue.username,
      weight: userFormValue.weight as unknown as number,
    };

    const cycle: CycleDto = {
      cycleNumber: 1,
      startDate: cycleFormValue.lastPeriodDate as unknown as Date,
      bleedingLength: cycleFormValue.bleedingLength as unknown as number,
      cycleLength: 28,
      firstHigherTemp: 0,
    };

    forkJoin({
      user: this.authService.updateUser(user),
      cycle: this.cycleService.addCycle(cycle),
    }).subscribe({
      next: () => {
        // Update credentials to mark profile as complete
        const currentCredentials = this.credentialService.credentials;
        if (currentCredentials) {
          this.credentialService.setCredentials(
            {
              ...currentCredentials,
              profileIncomplete: false,
            },
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
