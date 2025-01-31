import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CreateUserDto } from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';

@Component({
  standalone: true,
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  imports: [MaterialModule, ReactiveFormsModule, TranslateModule],
})
export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    age: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
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
  error: string | null = null;

  constructor(private authService: AuthenticationService) {}

  ngOnInit() {}

  register(): void {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValues: CreateUserDto = this.registrationForm.value;

    // Call registration service to handle the backend request
    this.authService.register(formValues).subscribe(
      (response) => {
        this.isLoading = false;
        // Handle successful registration (e.g., navigate to login page or show success message)
      },
      (error) => {
        this.isLoading = false;
        this.error = error.message || 'Registration failed. Please try again.';
      }
    );
  }
}
