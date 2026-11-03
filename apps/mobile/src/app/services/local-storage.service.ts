import { Injectable } from '@angular/core';
import {
  StorageKey,
  storagePrefix,
} from '../shared/constants/common.constants';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  getItem(key: StorageKey): unknown {
    const item = localStorage.getItem(storagePrefix + key);
    try {
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error parsing JSON from localStorage', e);
      return item;
    }
  }

  setItem(key: StorageKey, value: unknown): void {
    try {
      const valueToStore =
        typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(storagePrefix + key, valueToStore);
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  removeItem(key: StorageKey): void {
    try {
      localStorage.removeItem(storagePrefix + key);
    } catch (e) {
      console.error('Error removing item from localStorage', e);
    }
  }
}
