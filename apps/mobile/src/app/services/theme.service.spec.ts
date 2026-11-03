import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';
import { StorageKeys } from '../shared/constants/common.constants';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const store = new Map<string, unknown>();
  const storage = {
    getItem: jest.fn((key: string) => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn((key: string, value: unknown) => store.set(key, value)),
  };

  const create = (): ThemeService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: LocalStorageService, useValue: storage }],
    });
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    document.body.classList.remove('dark');
  });

  afterEach(() => document.body.classList.remove('dark'));

  it('starts from the stored choice', () => {
    store.set(StorageKeys.DARK_MODE, true);

    expect(create().isDark()).toBe(true);
  });

  it('falls back to light when nothing is stored and the system says nothing', () => {
    expect(create().isDark()).toBe(false);
  });

  it('applies the theme to the document, which is the only place that happens', () => {
    const theme = create();
    TestBed.flushEffects();
    expect(document.body.classList.contains('dark')).toBe(false);

    theme.set(true);
    TestBed.flushEffects();

    expect(document.body.classList.contains('dark')).toBe(true);
  });

  it('remembers a change so the next session starts the same way', () => {
    create().set(true);

    expect(storage.setItem).toHaveBeenCalledWith(StorageKeys.DARK_MODE, true);
    expect(create().isDark()).toBe(true);
  });

  it('toggles back and forth', () => {
    const theme = create();

    expect(theme.toggle()).toBe(true);
    expect(theme.toggle()).toBe(false);
    expect(theme.isDark()).toBe(false);
  });
});
