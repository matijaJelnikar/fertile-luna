import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';

export interface UserDto {
  username?: string;
  email: string;
  password: string;
  birthDate?: Date;
  weight?: number;
}

@Component({
  standalone: true,
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe, NgClass],
})
export class RegistrationComponent implements AfterViewInit {
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registrationForm: FormGroup = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  isLoading = signal(false);
  initialLoad = signal(true);
  error = signal<string | null>(null);

  private credentialsService = inject(CredentialsService);

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initialLoad.set(false);
    }, 10);
  }

  register(): void {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const formValues: UserDto = this.registrationForm.value;

    this.authService.register(formValues).subscribe({
      next: (response) => {
        // Store credentials after successful registration
        this.credentialsService.setCredentials(
          {
            email: formValues.email,
            token: response.access_token,
            profileIncomplete: response.profileIncomplete,
          },
          false
        );

        // Navigate directly to complete-profile
        this.router.navigate(['/complete-profile'], { replaceUrl: true });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(
          err.error?.message?.[0] || 'Registration failed. Please try again.'
        );
      },
    });
  }
}
