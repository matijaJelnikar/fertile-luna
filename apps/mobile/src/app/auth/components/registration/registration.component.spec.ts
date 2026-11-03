import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';
import { RegistrationComponent } from './registration.component';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;

  const authenticationService = {
    register: jest.fn(() =>
      of({ access_token: 'a-token', profileIncomplete: true })
    ),
  };
  const credentialsService = { setCredentials: jest.fn() };
  const router = { navigate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        RegistrationComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideTranslateService(),
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: CredentialsService, useValue: credentialsService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not register an empty form', () => {
    component.register();

    expect(authenticationService.register).not.toHaveBeenCalled();
  });

  it('registers, keeps the issued token for the session, and goes on to the profile', () => {
    component.registrationForm.setValue({
      email: 'me@example.test',
      password: 'secret',
    });

    component.register();

    expect(authenticationService.register).toHaveBeenCalledWith({
      email: 'me@example.test',
      password: 'secret',
    });
    expect(credentialsService.setCredentials).toHaveBeenCalledWith(
      { email: 'me@example.test', token: 'a-token', profileIncomplete: true },
      false
    );
    expect(router.navigate).toHaveBeenCalledWith(['/complete-profile'], {
      replaceUrl: true,
    });
    expect(component.isLoading()).toBe(false);
  });

  it('surfaces the server`s first message when registration is rejected', () => {
    authenticationService.register.mockReturnValueOnce(
      throwError(() => ({ error: { message: ['Email already in use'] } }))
    );
    component.registrationForm.setValue({
      email: 'taken@example.test',
      password: 'secret',
    });

    component.register();

    expect(component.error()).toBe('Email already in use');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });
});
