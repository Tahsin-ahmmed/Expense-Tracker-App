import {
  CURRENCIES,
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  symbolNeedsSpace,
  type CurrencyCode,
} from './currency';

/**
 * Money handling.
 *
 * All amounts are stored and calculated as integer minor units (hundredths:
 * poisha for BDT, cents for USD) in safe integers. Never use floating-point
 * values for money: 0.1 + 0.2 !== 0.3.
 */

/** An integer amount in minor units. Create with `toMinor` or `parseAmountInput`. */
export type MinorAmount = number & { readonly __brand: 'MinorAmount' };

/** Every supported currency has 100 minor units per major unit. */
export const MINOR_PER_MAJOR = 100;

/** Largest whole-unit amount accepted from user input (13 digits). */
const MAX_MAJOR_DIGITS = 13;

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

// ---------------------------------------------------------------------------
// Display currency
// ---------------------------------------------------------------------------

let activeCurrency: CurrencyCode = DEFAULT_CURRENCY;

/**
 * Sets the currency used by `formatMoney` when none is passed. Set from the
 * user's profile at app level; the app remounts its screens when it changes.
 */
export function setActiveCurrency(code: CurrencyCode): void {
  activeCurrency = code;
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

/** Symbol of a currency (default: the active one), e.g. "৳". */
export function currencySymbol(code: CurrencyCode = activeCurrency): string {
  return CURRENCIES[code].symbol;
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

/** Wraps an integer minor-unit value. Throws if the value is not a safe integer. */
export function toMinor(value: number): MinorAmount {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Money amount must be a safe integer, received ${value}`);
  }
  return value as MinorAmount;
}

/** Adds amounts exactly. Throws if the total exceeds the safe integer range. */
export function sumMinor(amounts: readonly MinorAmount[]): MinorAmount {
  let total = 0;
  for (const amount of amounts) {
    total += amount;
  }
  return toMinor(total);
}

// ---------------------------------------------------------------------------
// Parsing user input
// ---------------------------------------------------------------------------

/** Converts Bangla digits (০–৯) to ASCII digits (0–9). Other characters are unchanged. */
function normaliseDigits(input: string): string {
  return input.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Any supported symbol or code, plus common written forms (Tk, Rs.). Longest first. */
const PREFIX_PATTERN = new RegExp(
  `^(${[
    ...CURRENCY_CODES,
    ...CURRENCY_CODES.map((code) => CURRENCIES[code].symbol),
    'Tk.',
    'Tk',
    'Rs.',
  ]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')})\\s*`,
  'i',
);

/**
 * Parses an amount typed by the user into minor units, without floating-point maths.
 *
 * Accepts: "1250", "1,250.50", "৳ 1,00,000", "Tk 99.5", "$12", "১২৫০".
 * Returns `null` for empty, negative, malformed input, more than two decimal
 * places, or amounts too large to store safely.
 */
export function parseAmountInput(input: string): MinorAmount | null {
  const cleaned = normaliseDigits(input).trim().replace(PREFIX_PATTERN, '').replace(/,/g, '');

  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) {
    return null;
  }

  const [, majorPart, minorPart = ''] = match;
  const whole = majorPart.replace(/^0+(?=\d)/, '');
  if (whole.length > MAX_MAJOR_DIGITS) {
    return null;
  }

  return toMinor(Number(whole) * MINOR_PER_MAJOR + Number(minorPart.padEnd(2, '0')));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** "10000000" → "1,00,00,000" (lakh/crore grouping). */
function groupSouthAsian(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${lastThree}`;
}

/** "10000000" → "10,000,000". */
function groupStandard(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function withSymbol(sign: string, symbol: string, number: string): string {
  return `${sign}${symbol}${symbolNeedsSpace(symbol) ? ' ' : ''}${number}`;
}

export interface FormatMoneyOptions {
  /** Defaults to the active currency. */
  currency?: CurrencyCode;
  /** Prefix with the currency symbol. Default: true. */
  showSymbol?: boolean;
  /** 'always' shows .00; 'auto' hides decimals for whole amounts. Default: 'always'. */
  decimals?: 'always' | 'auto';
}

/**
 * Formats minor units for display, e.g. BDT 10000050 → "৳1,00,000.50",
 * USD 10000050 → "$100,000.50", PKR 50000 → "Rs 500.00".
 */
export function formatMoney(amount: MinorAmount, options: FormatMoneyOptions = {}): string {
  const { currency = activeCurrency, showSymbol = true, decimals = 'always' } = options;
  const info = CURRENCIES[currency];

  const absolute = Math.abs(amount);
  const whole = Math.floor(absolute / MINOR_PER_MAJOR);
  const remainder = absolute % MINOR_PER_MAJOR;

  const digits = String(whole);
  const grouped = info.grouping === 'southAsian' ? groupSouthAsian(digits) : groupStandard(digits);
  const fraction =
    decimals === 'auto' && remainder === 0 ? '' : `.${String(remainder).padStart(2, '0')}`;

  const sign = amount < 0 ? '-' : '';
  return showSymbol
    ? withSymbol(sign, info.symbol, `${grouped}${fraction}`)
    : `${sign}${grouped}${fraction}`;
}

/**
 * Short form for chart axes. South Asian currencies use K / L (lakh) / Cr
 * (crore): ৳25K, ৳1.5L, ৳1.2Cr. Others use K / M / B: $25K, $1.5M.
 * Whole units only; full amounts belong in labels and tooltips.
 */
export function formatMoneyCompact(
  amount: MinorAmount,
  currency: CurrencyCode = activeCurrency,
): string {
  const info = CURRENCIES[currency];
  const value = Math.abs(amount) / MINOR_PER_MAJOR;
  const sign = amount < 0 ? '-' : '';
  const units: [number, string][] =
    info.grouping === 'southAsian'
      ? [
          [10_000_000, 'Cr'],
          [100_000, 'L'],
          [1_000, 'K'],
        ]
      : [
          [1_000_000_000, 'B'],
          [1_000_000, 'M'],
          [1_000, 'K'],
        ];
  for (const [size, suffix] of units) {
    if (value >= size) {
      const scaled = Math.round((value / size) * 10) / 10;
      return withSymbol(sign, info.symbol, `${String(scaled).replace(/\.0$/, '')}${suffix}`);
    }
  }
  return withSymbol(sign, info.symbol, String(Math.round(value)));
}
