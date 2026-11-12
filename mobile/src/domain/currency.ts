/**
 * Supported currencies. Each user picks one (stored in their profile); all
 * their amounts are shown in it. Switching currency does NOT convert amounts.
 *
 * Every currency here uses 2 decimal places, so amounts are always stored as
 * integer hundredths ("minor units": poisha, cents, paisa, fils, ...).
 * The same list is enforced by a CHECK constraint on profiles.currency.
 */
export const CURRENCY_CODES = [
  'BDT',
  'USD',
  'EUR',
  'GBP',
  'INR',
  'PKR',
  'NPR',
  'LKR',
  'SAR',
  'AED',
  'QAR',
  'MYR',
  'SGD',
  'CAD',
  'AUD',
] as const;

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
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', grouping: 'standard' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', grouping: 'standard' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', grouping: 'standard' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', grouping: 'southAsian' },
  PKR: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', grouping: 'southAsian' },
  NPR: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', grouping: 'southAsian' },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', grouping: 'standard' },
  SAR: { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', grouping: 'standard' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', grouping: 'standard' },
  QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', grouping: 'standard' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', grouping: 'standard' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', grouping: 'standard' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', grouping: 'standard' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', grouping: 'standard' },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'BDT';

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCY_CODES.includes(value as CurrencyCode);
}

/** Symbols written as letters need a space before the number: "Rs 500", but "$500". */
export function symbolNeedsSpace(symbol: string): boolean {
  return /[A-Za-z]$/.test(symbol);
}
