import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoginResponse } from '@basal-temp-log-workspace/model';

import { LoginFlowEndpoints } from '../shared/constants/endpoints.constants';
import { AuthenticationService } from './authentication.service';
import { CredentialsService } from './credentials.service';
import { MockCredentialsService } from './credentials.service.mock';

const LOGIN_RESPONSE: LoginResponse = {
  access_token: 'a-token',
  profileIncomplete: false,
} as LoginResponse;

describe('AuthenticationService', () => {
  let authenticationService: AuthenticationService;
  let credentialsService: MockCredentialsService;
  let http: HttpTestingController;

  const login = (remember?: boolean) => {
    const request = authenticationService.login({
      email: 'me@example.test',
      password: '123',
      remember,
    });
    const subscription = request.subscribe();
    http.expectOne(LoginFlowEndpoints.LOGIN).flush(LOGIN_RESPONSE);
    subscription.unsubscribe();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CredentialsService, useClass: MockCredentialsService },
        AuthenticationService,
      ],
    });

    authenticationService = TestBed.inject(AuthenticationService);
    credentialsService = TestBed.inject(
      CredentialsService
    ) as unknown as MockCredentialsService;
    credentialsService.credentials = null;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('login', () => {
    it('posts the email and password, and never echoes them back', () => {
      const subscription = authenticationService
        .login({ email: 'me@example.test', password: '123' })
        .subscribe();

      const request = http.expectOne(LoginFlowEndpoints.LOGIN);
      expect(request.request.body).toEqual({
        email: 'me@example.test',
        password: '123',
      });

      request.flush(LOGIN_RESPONSE);
      subscription.unsubscribe();
    });

    it('returns the credentials carrying the issued token', (done) => {
      authenticationService
        .login({ email: 'me@example.test', password: '123' })
        .subscribe((credentials) => {
          expect(credentials.email).toBe('me@example.test');
          expect(credentials.token).toBe('a-token');
          done();
        });

      http.expectOne(LoginFlowEndpoints.LOGIN).flush(LOGIN_RESPONSE);
    });

    it('authenticates the user', () => {
      expect(credentialsService.isAuthenticated()).toBe(false);

      login();

      expect(credentialsService.isAuthenticated()).toBe(true);
      expect(credentialsService.credentials?.token).toBe('a-token');
    });

    it('persists credentials for the session when remember is not asked for', () => {
      const setCredentials = jest.spyOn(credentialsService, 'setCredentials');

      login();

      expect(setCredentials.mock.calls[0][1]).toBeUndefined();
    });

    it('persists credentials across sessions when remember is asked for', () => {
      const setCredentials = jest.spyOn(credentialsService, 'setCredentials');

      login(true);

      expect(setCredentials.mock.calls[0][1]).toBe(true);
    });

    it('leaves the user unauthenticated when the request fails', (done) => {
      authenticationService
        .login({ email: 'me@example.test', password: 'wrong' })
        .subscribe({
          error: () => {
            expect(credentialsService.isAuthenticated()).toBe(false);
            done();
          },
        });

      http
        .expectOne(LoginFlowEndpoints.LOGIN)
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('clears the user authentication', (done) => {
      login();
      expect(credentialsService.isAuthenticated()).toBe(true);

      authenticationService.logout().subscribe(() => {
        expect(credentialsService.isAuthenticated()).toBe(false);
        expect(credentialsService.credentials).toBeNull();
        done();
      });
    });
  });
});
