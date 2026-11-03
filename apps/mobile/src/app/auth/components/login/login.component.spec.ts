import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthenticationService } from '../../authentication.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const authenticationService = {
    login: jest.fn(() =>
      of({ email: 'me@example.test', token: '123', profileIncomplete: false })
    ),
  };
  const router = { navigate: jest.fn() };
  const route = { snapshot: { queryParams: {} as Record<string, string> } };

  const fillIn = (email: string, password: string) =>
    component.loginForm().value.set({ email, password, remember: false });

  const submit = async () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    route.snapshot.queryParams = {};

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideTranslateService(),
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an invalid, empty form', () => {
    expect(component.loginForm().valid()).toBe(false);
  });

  it('does not sign in with an empty form, and flags the missing fields', async () => {
    await submit();

    expect(authenticationService.login).not.toHaveBeenCalled();
    expect(component.loginForm.email().touched()).toBe(true);
  });

  it('signs in with what was typed and lands on the default route', async () => {
    fillIn('me@example.test', 'secret');

    await submit();

    expect(authenticationService.login).toHaveBeenCalledWith({
      email: 'me@example.test',
      password: 'secret',
      remember: false,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/'], { replaceUrl: true });
    expect(component.loginForm().submitting()).toBe(false);
  });

  it('returns to the route the guard redirected from', async () => {
    route.snapshot.queryParams = { redirect: '/history' };
    fillIn('me@example.test', 'secret');

    await submit();

    expect(router.navigate).toHaveBeenCalledWith(['/history'], {
      replaceUrl: true,
    });
  });

  it('shows the server`s message and stays put when sign-in fails', async () => {
    authenticationService.login.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );
    fillIn('me@example.test', 'wrong');

    await submit();

    expect(component.error()).toBe('Invalid credentials');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loginForm().submitting()).toBe(false);
  });
});
