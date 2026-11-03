import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { NewCycleDialogService } from '../../components/new-cycle/new-cycle-dialog.service';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../state/user/user.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  const isDark = signal(false);
  const theme = { isDark, set: jest.fn((value: boolean) => isDark.set(value)) };

  const contraceptionStoppedOn = signal<string | null>(null);
  const user = {
    contraceptionStoppedOn,
    setContraceptionStoppedOn: jest.fn(() => of({})),
  };

  const newCycleDialog = { start: jest.fn() };
  const router = { navigate: jest.fn() };

  const clearButton = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('button[mat-button]');
  const startCycleButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[mat-stroked-button]');

  beforeEach(async () => {
    jest.clearAllMocks();
    isDark.set(false);
    contraceptionStoppedOn.set(null);

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ThemeService, useValue: theme },
        { provide: UserService, useValue: user },
        { provide: NewCycleDialogService, useValue: newCycleDialog },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the theme the service reports', () => {
    expect(component.isDarkMode()).toBe(false);

    isDark.set(true);
    expect(component.isDarkMode()).toBe(true);
  });

  it('asks the service to change the theme rather than touching the DOM', () => {
    component.onDarkModeChange(true);

    expect(theme.set).toHaveBeenCalledWith(true);
    expect(component.isDarkMode()).toBe(true);
  });

  it('turns it back off again', () => {
    component.onDarkModeChange(true);
    component.onDarkModeChange(false);

    expect(theme.set).toHaveBeenLastCalledWith(false);
    expect(component.isDarkMode()).toBe(false);
  });

  describe('starting a new cycle', () => {
    it('starts one through the new-cycle dialog and shows it on the home screen', () => {
      newCycleDialog.start.mockReturnValue(of({ uuid: 'c4' }));

      startCycleButton().click();

      expect(newCycleDialog.start).toHaveBeenCalledWith();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('stays on settings when the dialog is dismissed', () => {
      newCycleDialog.start.mockReturnValue(of(null));

      startCycleButton().click();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('the date hormonal contraception was stopped', () => {
    it('shows the stored date as that calendar day', () => {
      contraceptionStoppedOn.set('2026-02-01');

      const shown = component.contraceptionStoppedOn();
      expect([shown?.getFullYear(), shown?.getMonth(), shown?.getDate()]).toEqual([2026, 1, 1]);
    });

    it('saves a picked date through the user service', () => {
      const picked = new Date(2026, 1, 1);

      component.onContraceptionStoppedOnChange(picked);

      expect(user.setContraceptionStoppedOn).toHaveBeenCalledWith(picked);
    });

    it('offers to clear a recorded date, and clears it', () => {
      expect(clearButton()).toBeNull();

      contraceptionStoppedOn.set('2026-02-01');
      fixture.detectChanges();
      clearButton()?.click();

      expect(user.setContraceptionStoppedOn).toHaveBeenCalledWith(null);
    });
  });
});
