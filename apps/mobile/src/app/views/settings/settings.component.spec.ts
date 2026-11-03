import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { NewCycleDialogService } from '../../components/new-cycle/new-cycle-dialog.service';
import { ThemeService } from '../../services/theme.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  const isDark = signal(false);
  const theme = { isDark, set: jest.fn((value: boolean) => isDark.set(value)) };

  const newCycleDialog = { start: jest.fn() };
  const router = { navigate: jest.fn() };

  const startCycleButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[mat-stroked-button]');

  beforeEach(async () => {
    jest.clearAllMocks();
    isDark.set(false);

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ThemeService, useValue: theme },
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
});
