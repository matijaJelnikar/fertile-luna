import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { storagePrefix, StorageKeys } from './shared/constants/common.constants';

const themeKey = storagePrefix + StorageKeys.DARK_MODE;

describe('AppComponent', () => {
  const createComponent = () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    localStorage.clear();
    document.body.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    TestBed.inject(TranslateService).setTranslation('en', {
      app: { name: 'Fertile Luna' },
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark');
  });

  it('renders the routed view', () => {
    const fixture = createComponent();

    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('takes its title from the translation, not a hardcoded string', () => {
    const fixture = createComponent();

    expect(fixture.componentInstance.title).toBe('Fertile Luna');
  });

  it('applies the stored dark theme', () => {
    localStorage.setItem(themeKey, 'true');

    createComponent();

    expect(document.body.classList.contains('dark')).toBe(true);
  });

  it('leaves the theme light when dark mode is stored as off', () => {
    localStorage.setItem(themeKey, 'false');

    createComponent();

    expect(document.body.classList.contains('dark')).toBe(false);
  });
});
