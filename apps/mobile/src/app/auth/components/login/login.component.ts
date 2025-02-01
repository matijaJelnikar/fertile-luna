import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { CommonModule, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    NgClass,
  ],
})
export class LoginComponent implements AfterViewInit {
  error: string | undefined;
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    remember: new FormControl(false, {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
  isLoading = false;
  destroyRef = inject(DestroyRef);
  initialLoad = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initialLoad = false;
    }, 10);
  }

  login() {
    this.isLoading = true;
    this.authenticationService
      .login(this.loginForm.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loginForm.markAsPristine();
          this.isLoading = false;
        })
      )
      .subscribe({
        complete: () => {
          this.router.navigate(
            [this.route.snapshot.queryParams['redirect'] || '/'],
            { replaceUrl: true }
          );
        },
        error: (err) => {
          this.error = err.error?.message;
        },
      });
  }
}
