import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthenticationService, CredentialsService } from '../auth';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  const credentialsService = { credentials: null as { token: string } | null };
  const authenticationService = { logout: jest.fn(() => of(true)) };
  const router = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    credentialsService.credentials = null;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: CredentialsService, useValue: credentialsService },
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('attaches the stored token as a Bearer header', () => {
    credentialsService.credentials = { token: 'a-token' };

    http.get('/api/cycle/getAll').subscribe();

    const request = backend.expectOne('/api/cycle/getAll');
    expect(request.request.headers.get('Authorization')).toBe('Bearer a-token');
    request.flush([]);
  });

  it('sends no Authorization header when nobody is signed in', () => {
    http.get('/api/auth/login').subscribe();

    const request = backend.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('signs the user out and redirects to login on a 401', (done) => {
    credentialsService.credentials = { token: 'expired' };

    http.get('/api/cycle/getAll').subscribe({
      error: () => {
        expect(authenticationService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });

    backend
      .expectOne('/api/cycle/getAll')
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('leaves other failures alone', (done) => {
    credentialsService.credentials = { token: 'a-token' };

    http.get('/api/cycle/getAll').subscribe({
      error: () => {
        expect(authenticationService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });

    backend
      .expectOne('/api/cycle/getAll')
      .flush('Boom', { status: 500, statusText: 'Server Error' });
  });
});
