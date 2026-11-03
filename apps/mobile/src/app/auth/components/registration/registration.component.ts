import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { LoginResponse } from '@basal-temp-log-workspace/model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  host: { class: 'flex h-screen flex-col items-center bg-surface' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    FormRoot,
    TranslatePipe,
    MatAnchor,
    RouterLink,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
  ],
})
export class RegistrationComponent {
  private authService = inject(AuthenticationService);
  private credentialsService = inject(CredentialsService);
  private router = inject(Router);
  private translate = inject(TranslateService);

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

  private async register(account: RegistrationModel): Promise<undefined> {
    let response: LoginResponse;
    try {
      response = await firstValueFrom(this.authService.register(account));
    } catch (err) {
      this.error.set(
        (err as { error?: { message?: string[] } }).error?.message?.[0] ||
          this.translate.instant('register.failed')
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
