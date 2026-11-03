import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AuthenticationService } from '../../auth';
import { CycleService } from '../../state/measurements/cycle.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;

  const authenticationService = { logout: jest.fn(() => of(true)) };
  const cycleService = { getCycles: jest.fn(() => of([])) };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ShellComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: CycleService, useValue: cycleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the cycles once, so every authenticated route has them', () => {
    expect(cycleService.getCycles).toHaveBeenCalledTimes(1);
  });

  it('links every tab to its route', () => {
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('nav a')
    ).map((a) => a.getAttribute('href'));

    expect(links).toEqual(['/home', '/history', '/settings']);
  });

  it('signs the user out and returns them to login', () => {
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate');

    component.logout();

    expect(authenticationService.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
