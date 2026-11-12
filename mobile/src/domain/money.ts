/**
 * Money handling for Bangladeshi Taka (BDT).
 *
 * All amounts are stored and calculated as whole poisha (1 Taka = 100 poisha)
 * in safe integers. Never use floating-point values for money: 0.1 + 0.2 !== 0.3.
 */

/** An integer amount in poisha. Create with `toPoisha` or `parseTakaInput`. */
export type Poisha = number & { readonly __brand: 'Poisha' };

export const POISHA_PER_TAKA = 100;
export const TAKA_SYMBOL = '৳';

/** Largest whole-Taka amount accepted from user input (999,99,99,99,999 Tk). */
const MAX_TAKA_DIGITS = 13;

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Wraps an integer poisha value. Throws if the value is not a safe integer. */
export function toPoisha(value: number): Poisha {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Poisha amount must be a safe integer, received ${value}`);
  }
  return value as Poisha;
}

/** Converts Bangla digits (০–৯) to ASCII digits (0–9). Other characters are unchanged. */
function normaliseDigits(input: string): string {
  return input.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

/**
 * Parses an amount typed by the user into poisha, without floating-point maths.
 *
 * Accepts: "1250", "1,250.50", "৳ 1,00,000", "Tk 99.5", "১২৫০".
 * Returns `null` for empty, negative, malformed input, more than two decimal
 * places, or amounts too large to store safely.
 */
export function parseTakaInput(input: string): Poisha | null {
  const cleaned = normaliseDigits(input)
    .trim()
    .replace(/^(৳|tk\.?|bdt)\s*/i, '')
    .replace(/,/g, '');

  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) {
    return null;
  }

  const [, takaPart, poishaPart = ''] = match;
  const wholeTaka = takaPart.replace(/^0+(?=\d)/, '');
  if (wholeTaka.length > MAX_TAKA_DIGITS) {
    return null;
  }

  const poisha = Number(wholeTaka) * POISHA_PER_TAKA + Number(poishaPart.padEnd(2, '0'));
  return toPoisha(poisha);
}

/**
 * Groups a string of digits the South Asian way: the last three digits, then
 * groups of two (lakh, crore). "10000000" → "1,00,00,000".
 */
function groupSouthAsian(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${lastThree}`;
}

export interface FormatTakaOptions {
  /** Prefix with ৳. Default: true. */
  showSymbol?: boolean;
  /** 'always' shows .00; 'auto' hides decimals for whole Taka. Default: 'always'. */
  decimals?: 'always' | 'auto';
}

/** Formats poisha as Taka with lakh/crore grouping, e.g. 10000050 → "৳1,00,000.50". */
export function formatTaka(amount: Poisha, options: FormatTakaOptions = {}): string {
  const { showSymbol = true, decimals = 'always' } = options;

  const absolute = Math.abs(amount);
  const wholeTaka = Math.floor(absolute / POISHA_PER_TAKA);
  const remainder = absolute % POISHA_PER_TAKA;

  const grouped = groupSouthAsian(String(wholeTaka));
  const fraction =
    decimals === 'auto' && remainder === 0 ? '' : `.${String(remainder).padStart(2, '0')}`;

  const sign = amount < 0 ? '-' : '';
  const symbol = showSymbol ? TAKA_SYMBOL : '';
  return `${sign}${symbol}${grouped}${fraction}`;
}
