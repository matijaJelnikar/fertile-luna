export const storagePrefix = 'fertileLuna_' as const;

export const StorageKeys = {
  DARK_MODE: 'darkMode',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
