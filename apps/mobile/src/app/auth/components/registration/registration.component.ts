import { NgClass } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
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

export interface UserDto {
  username: string;
  age: number;
  email: string;
  password: string;
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
      complete: () => {
        this.router.navigate(
          [this.route.snapshot.queryParams['redirect'] || '/'],
          { replaceUrl: true }
        );
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
