/**
 * PIN rules. The PIN is used as the account password, so the app blocks the
 * easiest-to-guess choices. The server only enforces a minimum length of 6.
 */
export const PIN_LENGTH = 6;

const PIN_PATTERN = /^\d{6}$/;

/** PINs common enough to be among the first guesses, beyond the patterns below. */
const COMMON_PINS = new Set([
  '112233',
  '111222',
  '123321',
  '102030',
  '147258',
  '159753',
  '696969',
  '000123',
  '789456',
  '456789',
]);

export function isPinFormat(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

/** True for PINs that are easy to guess: repeated, sequential or patterned. */
export function isWeakPin(pin: string): boolean {
  if (!isPinFormat(pin)) {
    return false;
  }
  const digits = [...pin].map(Number);

  // 111111, 000000
  if (digits.every((digit) => digit === digits[0])) {
    return true;
  }

  // 123456, 345678, 987654, 654321 (each step +1 or each step −1)
  const steps = digits.slice(1).map((digit, index) => digit - digits[index]);
  if (steps.every((step) => step === 1) || steps.every((step) => step === -1)) {
    return true;
  }

  // 121212, 123123 (a 2- or 3-digit block repeated)
  if (pin === pin.slice(0, 2).repeat(3) || pin === pin.slice(0, 3).repeat(2)) {
    return true;
  }

  return COMMON_PINS.has(pin);
}
