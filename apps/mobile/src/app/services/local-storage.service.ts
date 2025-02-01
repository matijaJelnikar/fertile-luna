import { Injectable } from '@angular/core';
import { storagePrefix } from '../shared/constants/common.constants';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  getItem(key: string): any {
    const item = localStorage.getItem(storagePrefix + key);
    try {
      // If the item exists and is a valid JSON string, parse it
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error parsing JSON from localStorage', e);
      return item;
    }
  }

  setItem(key: string, value: any): void {
    try {
      const valueToStore =
        typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(storagePrefix + key, valueToStore);
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(storagePrefix + key);
    } catch (e) {
      console.error('Error removing item from localStorage', e);
    }
  }

  // Method to clear all items from localStorage
  clear(): void {
    try {
      // TODO
    } catch (e) {
      console.error('Error clearing localStorage', e);
    }
  }
}
