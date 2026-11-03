import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { StorageKeys } from '../shared/constants/common.constants';

const DARK_CLASS = 'dark';

/**
 * The one place the theme is decided and the one place `document.body.classList` is touched.
 *
 * Components read `isDark()`; they never ask the DOM. A component that reads the body's class list
 * cannot be tested without a document and cannot react when the theme changes.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);
  private storage = inject(LocalStorageService);

  private state = signal<boolean>(this.initial());
  readonly isDark = this.state.asReadonly();

  constructor() {
    effect(() => {
      // The only DOM write. Styles react to the class; nothing reads it back.
      this.document.body.classList.toggle(DARK_CLASS, this.state());
    });
  }

  set(isDark: boolean): void {
    this.state.set(isDark);
    this.storage.setItem(StorageKeys.DARK_MODE, isDark);
  }

  toggle(): boolean {
    this.set(!this.state());
    return this.state();
  }

  /** A stored choice wins; otherwise follow the system, which may be unavailable in a test DOM. */
  private initial(): boolean {
    const stored = this.storage.getItem(StorageKeys.DARK_MODE);
    if (stored !== null && stored !== undefined) return !!stored;

    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }
}
