/**
 * Sign-in identifiers: an email address or a Bangladeshi mobile number.
 *
 * Phone numbers are normalised to E.164 (+8801XXXXXXXXX) so "01712-345678",
 * "+880 1712 345678" and "8801712345678" all refer to the same account.
 */
export type Identifier = { kind: 'email'; email: string } | { kind: 'phone'; phone: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Bangladeshi mobile numbers: 01 + operator digit 3–9 + 8 digits.
const LOCAL_MOBILE_PATTERN = /^01[3-9]\d{8}$/;
const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

function normaliseDigits(input: string): string {
  return input.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

/** Parses what the user typed. Returns null if it is neither a valid email nor a BD mobile number. */
export function parseIdentifier(input: string): Identifier | null {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    return EMAIL_PATTERN.test(email) ? { kind: 'email', email } : null;
  }

  let digits = normaliseDigits(trimmed).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+880')) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('880')) {
    digits = `0${digits.slice(3)}`;
  }
  return LOCAL_MOBILE_PATTERN.test(digits)
    ? { kind: 'phone', phone: `+880${digits.slice(1)}` }
    : null;
}

/**
 * Formats a stored phone number for display: "+8801712345678" or
 * "8801712345678" → "01712-345678". Returns the input unchanged otherwise.
 */
export function formatPhoneForDisplay(phone: string): string {
  const match = /^\+?880(1\d{9})$/.exec(phone);
  if (!match) {
    return phone;
  }
  const local = `0${match[1]}`;
  return `${local.slice(0, 5)}-${local.slice(5)}`;
}
