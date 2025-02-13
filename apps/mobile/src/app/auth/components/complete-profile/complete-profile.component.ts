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
  router = inject(Router);

  submit(): void {
    const userFormValue: CompleteProfileDto = this.userFormGroup.value;
    const cycleFormValue: CycleDto = this.cycleFormGroup.value;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
