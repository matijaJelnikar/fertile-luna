import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { ThemeService } from '../../services/theme.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  const isDark = signal(false);
  const theme = { isDark, set: jest.fn((value: boolean) => isDark.set(value)) };

  beforeEach(async () => {
    jest.clearAllMocks();
    isDark.set(false);

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [{ provide: ThemeService, useValue: theme }],
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
});
