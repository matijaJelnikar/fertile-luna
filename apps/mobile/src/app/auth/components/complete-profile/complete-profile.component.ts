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
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';
import { UserDto } from '../registration/registration.component';
import { CredentialsService } from '../../credentials.service';

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
  router = inject(Router);

  submit(): void {
    const userFormValue = this.userFormGroup.value;
    const cycleFormValue = this.cycleFormGroup.value;


    const user: Partial<UserDto> = {
       email: this.credentialService.credentials?.email,
       birthDate: userFormValue.birthDate as unknown as Date,
       username: userFormValue.username,
       weight: userFormValue.weight as unknown as number
    }
    this.authService.updateUser(user).subscribe(() => {
      this.router.navigate(['/login']);
    })
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
