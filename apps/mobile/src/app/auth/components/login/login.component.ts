import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
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
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    MaterialModule,
    NgClass,
  ],
})
export class LoginComponent implements AfterViewInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authenticationService = inject(AuthenticationService);

  error = signal<string | undefined>(undefined);
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
  isLoading = signal(false);
  destroyRef = inject(DestroyRef);
  initialLoad = signal(true);

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initialLoad.set(false);
    }, 10);
  }

  login() {
    this.isLoading.set(true);
    this.authenticationService
      .login(this.loginForm.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loginForm.markAsPristine();
          this.isLoading.set(false);
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
          this.error.set(err.error?.message);
        },
      });
  }
}
