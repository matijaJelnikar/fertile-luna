export const storagePrefix = 'fertileLuna_' as const;

export const StorageKeys = {
  DARK_MODE: 'darkMode',
  CHART_ALL_ROWS: 'chartAllRows',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const MOBILE_DIALOG_CONFIG = {
  width: '90%',
  maxWidth: '95vw',
  height: 'auto',
  maxHeight: '95vh',
  panelClass: 'mobile-dialog',
  autoFocus: false,
} as const;
