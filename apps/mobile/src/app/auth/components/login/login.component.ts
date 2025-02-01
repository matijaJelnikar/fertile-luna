import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../material.module';
import { AuthenticationService } from '../../authentication.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MaterialModule],
})
export class LoginComponent implements OnInit {
  error: string | undefined;
  loginForm!: FormGroup;
  isLoading = false;
  destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService
  ) {
    this.createForm();
  }

  ngOnInit() {}

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
        error: (error) => {
          this.error = error;
        },
      });
  }

  private createForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      remember: true,
    });
  }
}
