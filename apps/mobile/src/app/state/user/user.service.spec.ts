import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { API } from '../../shared/constants/endpoints.constants';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // The profile loads on its own; these tests answer it only where they read it.
    http.match(API.auth.me);
    http.verify();
  });

  it('reads the date hormonal contraception was stopped from the profile', async () => {
    TestBed.flushEffects();
    http.expectOne(API.auth.me).flush({
      email: 'ana@example.com',
      contraceptionStoppedOn: '2026-02-01',
    });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.contraceptionStoppedOn()).toBe('2026-02-01');
  });

  it('stores a picked date as its calendar day, whatever the time of day', () => {
    service.setContraceptionStoppedOn(new Date(2026, 1, 1, 23, 30)).subscribe();

    const request = http.expectOne(API.auth.updateUser);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      contraceptionStoppedOn: '2026-02-01',
    });
    request.flush({});
  });

  it('clears the date with null', () => {
    service.setContraceptionStoppedOn(null).subscribe();

    const request = http.expectOne(API.auth.updateUser);
    expect(request.request.body).toEqual({ contraceptionStoppedOn: null });
    request.flush({});
  });
});
