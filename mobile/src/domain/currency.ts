/**
 * Supported currencies. Each user picks one (stored in their profile); all
 * their amounts are shown in it. Switching currency does NOT convert amounts.
 *
 * Every currency here uses 2 decimal places, so amounts are always stored as
 * integer hundredths ("minor units": poisha, paise, cents, pence).
 * The database CHECK constraint on profiles.currency allows a wider list
 * (kept for flexibility); the app offers only these. An unknown stored value
 * falls back to BDT when read.
 */
export const CURRENCY_CODES = ['BDT', 'INR', 'USD', 'EUR', 'GBP'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** 'southAsian' = 1,00,000 (lakh/crore); 'standard' = 100,000 (thousand/million). */
export type DigitGrouping = 'southAsian' | 'standard';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  grouping: DigitGrouping;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', grouping: 'southAsian' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', grouping: 'southAsian' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', grouping: 'standard' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', grouping: 'standard' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', grouping: 'standard' },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'BDT';

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCY_CODES.includes(value as CurrencyCode);
}

/** Symbols written as letters need a space before the number (e.g. "Tk 500"); "$500" does not. */
export function symbolNeedsSpace(symbol: string): boolean {
  return /[A-Za-z]$/.test(symbol);
}
