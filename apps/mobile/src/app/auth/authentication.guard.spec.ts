import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import { AuthenticationGuard } from './authentication.guard';
import { CredentialsService } from './credentials.service';
import { MockCredentialsService } from './credentials.service.mock';

describe('AuthenticationGuard', () => {
  let authenticationGuard: AuthenticationGuard;
  let credentialsService: MockCredentialsService;
  const router = { navigate: jest.fn() };

  const state = (url: string): RouterStateSnapshot =>
    ({ url }) as RouterStateSnapshot;

  const canActivate = (url = '/home') =>
    authenticationGuard.canActivate(new ActivatedRouteSnapshot(), state(url));

  beforeEach(() => {
    router.navigate.mockClear();

    TestBed.configureTestingModule({
      providers: [
        AuthenticationGuard,
        { provide: CredentialsService, useClass: MockCredentialsService },
        { provide: Router, useValue: router },
      ],
    });

    authenticationGuard = TestBed.inject(AuthenticationGuard);
    credentialsService = TestBed.inject(
      CredentialsService
    ) as unknown as MockCredentialsService;
  });

  it('lets an authenticated user with a complete profile through', () => {
    expect(canActivate()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user to login', () => {
    credentialsService.credentials = null;

    expect(canActivate('/history')).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirect: '/history' },
      replaceUrl: true,
    });
  });

  it('redirects a user whose profile is incomplete to complete-profile', () => {
    credentialsService.credentials = {
      email: 'me@example.test',
      token: '123',
      profileIncomplete: true,
    };

    expect(canActivate('/home')).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/complete-profile'], {
      queryParams: { redirect: '/home' },
      replaceUrl: true,
    });
  });
});
