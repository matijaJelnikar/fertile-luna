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
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

import {
  AuthenticationService,
  LoginContext,
} from '../../authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
    MatSlideToggle,
  ],
})
export class LoginComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authenticationService = inject(AuthenticationService);

  error = signal<string | undefined>(undefined);

  private credentials = signal<Required<LoginContext>>({
    email: '',
    password: '',
    remember: false,
  });

  loginForm = form(
    this.credentials,
    (path) => {
      required(path.email);
      required(path.password);
    },
    { submission: { action: (field) => this.signIn(field().value()) } }
  );

  private async signIn(credentials: LoginContext): Promise<undefined> {
    try {
      await lastValueFrom(this.authenticationService.login(credentials), {
        defaultValue: undefined,
      });
    } catch (err) {
      this.error.set((err as { error?: { message?: string } }).error?.message);
      return;
    }
    this.router.navigate([this.route.snapshot.queryParams['redirect'] || '/'], {
      replaceUrl: true,
    });
  }
}
