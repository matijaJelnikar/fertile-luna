import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router } from '@angular/router';
import { LoginResponse } from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';

export interface UserDto {
  username?: string;
  email: string;
  password: string;
  birthDate?: Date;
  weight?: number;
}

type RegistrationModel = Pick<UserDto, 'email' | 'password'>;

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    FormRoot,
    TranslatePipe,
    MatAnchor,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
  ],
})
export class RegistrationComponent implements AfterViewInit {
  private authService = inject(AuthenticationService);
  private credentialsService = inject(CredentialsService);
  private router = inject(Router);

  initialLoad = signal(true);
  error = signal<string | null>(null);

  private account = signal<RegistrationModel>({ email: '', password: '' });

  registrationForm = form(
    this.account,
    (path) => {
      required(path.email);
      required(path.password);
    },
    { submission: { action: (field) => this.register(field().value()) } }
  );

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initialLoad.set(false);
    }, 10);
  }

  private async register(account: RegistrationModel): Promise<undefined> {
    let response: LoginResponse;
    try {
      response = await firstValueFrom(this.authService.register(account));
    } catch (err) {
      this.error.set(
        (err as { error?: { message?: string[] } }).error?.message?.[0] ||
          'Registration failed. Please try again.'
      );
      return;
    }
    this.credentialsService.setCredentials(
      {
        email: account.email,
        token: response.access_token,
        profileIncomplete: response.profileIncomplete,
      },
      false
    );
    this.router.navigate(['/complete-profile'], { replaceUrl: true });
  }
}
