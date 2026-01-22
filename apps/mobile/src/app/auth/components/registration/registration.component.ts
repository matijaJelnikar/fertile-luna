import { NgClass } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';

export interface UserDto {
  username?: string;
  email: string;
  password: string;
  birthDate?: Date
  weight?: number
}

@Component({
  standalone: true,
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  imports: [MaterialModule, ReactiveFormsModule, TranslateModule, NgClass],
})
export class RegistrationComponent implements AfterViewInit {
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

  isLoading = false;
  initialLoad = true;
  error: string | null = null;

  private credentialsService = inject(CredentialsService);

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initialLoad = false;
    }, 10);
  }

  register(): void {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading = true;
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
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error =
          err.error?.message?.[0] || 'Registration failed. Please try again.';
      },
    });
  }
}
