import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {}

  register(): void {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValues: CreateUserDto = this.registrationForm.value;

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
        console.log(err);
        this.error =
          err.error?.message?.[0] || 'Registration failed. Please try again.';
      },
    });
  }
}
