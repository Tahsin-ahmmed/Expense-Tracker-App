import { DEFAULT_CURRENCY, type CurrencyCode } from './currency';
import type { IsoDate } from './date';
import { toMinor, type MinorAmount } from './money';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DISPLAY_NAME_MAX_LENGTH = 60;

/** A user's preferences and starting balance. */
export interface Profile {
  displayName: string | null;
  currency: CurrencyCode;
  /** Money the user had on `openingBalanceDate` (can be negative). */
  openingBalance: MinorAmount;
  /** Day the opening balance applies from; null until the user sets it. */
  openingBalanceDate: IsoDate | null;
  theme: ThemePreference;
  weekStartsOn: Weekday;
}

export type ProfileUpdate = Partial<Profile>;

/** Used until the user saves preferences (no database row yet). */
export const DEFAULT_PROFILE: Profile = {
  displayName: null,
  currency: DEFAULT_CURRENCY,
  openingBalance: toMinor(0),
  openingBalanceDate: null,
  theme: 'system',
  weekStartsOn: 6,
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

export function isWeekday(value: unknown): value is Weekday {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 6;
}
