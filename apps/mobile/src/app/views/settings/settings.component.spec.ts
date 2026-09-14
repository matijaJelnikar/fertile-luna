import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { LocalStorageService } from '../../services/local-storage.service';
import { StorageKeys } from '../../shared/constants/common.constants';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  const store = new Map<string, unknown>();
  const localStorageService = {
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    setItem: jest.fn((key: string, value: unknown) => store.set(key, value)),
  };

  const setup = async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: LocalStorageService, useValue: localStorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    store.clear();
    jest.clearAllMocks();
    document.body.classList.remove('dark');
    await setup();
  });

  afterEach(() => document.body.classList.remove('dark'));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts from the stored preference', async () => {
    store.set(StorageKeys.DARK_MODE, true);

    await setup();

    expect(component.isDarkMode).toBe(true);
  });

  it('turns dark mode on and remembers it', () => {
    component.onDarkModeChange();

    expect(component.isDarkMode).toBe(true);
    expect(localStorageService.setItem).toHaveBeenCalledWith(
      StorageKeys.DARK_MODE,
      true
    );
  });

  it('turns dark mode back off and remembers that too', () => {
    component.onDarkModeChange();
    component.onDarkModeChange();

    expect(component.isDarkMode).toBe(false);
    expect(localStorageService.setItem).toHaveBeenLastCalledWith(
      StorageKeys.DARK_MODE,
      false
    );
  });
});
