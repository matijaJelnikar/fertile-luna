import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CycleService } from '../../../state/measurements/cycle.service';
import { AuthenticationService } from '../../authentication.service';
import { CredentialsService } from '../../credentials.service';
import { CompleteProfileComponent } from './complete-profile.component';

describe('CompleteProfileComponent', () => {
  let component: CompleteProfileComponent;
  let fixture: ComponentFixture<CompleteProfileComponent>;

  const authenticationService = {
    updateUser: jest.fn(() => of(true)),
    logout: jest.fn(() => of(true)),
  };
  const cycleService = { addCycle: jest.fn(() => of({ uuid: 'cycle-1' })) };
  const credentialsService = {
    credentials: {
      email: 'me@example.test',
      token: '123',
      profileIncomplete: true,
    },
    setCredentials: jest.fn(),
  };
  const router = { navigate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        CompleteProfileComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideTranslateService(),
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: CredentialsService, useValue: credentialsService },
        { provide: CycleService, useValue: cycleService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleteProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('saves the profile and the first cycle together, then marks the profile complete', () => {
    component.profileForm().value.set({
      username: 'Ana',
      birthDate: new Date(1995, 3, 2),
      weight: 62,
    });
    component.cycleForm().value.set({
      lastPeriodDate: new Date(2026, 3, 1),
      bleedingLength: 5,
    });

    component.submit();

    expect(authenticationService.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'me@example.test', username: 'Ana', weight: 62 })
    );
    expect(cycleService.addCycle).toHaveBeenCalledWith(
      expect.objectContaining({ cycleNumber: 1, bleedingLength: 5 })
    );
    expect(credentialsService.setCredentials).toHaveBeenCalledWith(
      expect.objectContaining({ profileIncomplete: false }),
      true
    );
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('saves nothing until both steps are filled in', () => {
    component.profileForm().value.set({ username: 'Ana', birthDate: null, weight: null });

    component.submit();

    expect(authenticationService.updateUser).not.toHaveBeenCalled();
    expect(cycleService.addCycle).not.toHaveBeenCalled();
  });

  it('signs the user out and returns them to login', () => {
    component.logout();

    expect(authenticationService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
