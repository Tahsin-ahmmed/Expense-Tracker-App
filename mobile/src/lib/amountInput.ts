import { parseAmountInput, toMinor, type MinorAmount } from '@/domain/money';
import { t } from '@/i18n';

export type AmountInputResult = { ok: true; amount: MinorAmount } | { ok: false; message: string };

/**
 * Parses an amount that may be negative ("-500", "−1,250.50", "-৳500").
 * Returns null when it is not a valid amount.
 */
export function parseSignedAmountInput(text: string): MinorAmount | null {
  const trimmed = text.trim();
  const negative = /^[-−]/.test(trimmed);
  const amount = parseAmountInput(negative ? trimmed.slice(1) : trimmed);
  if (amount === null) {
    return null;
  }
  return negative && amount !== 0 ? toMinor(-amount) : amount;
}

/** Validates a typed money amount: required, well-formed, more than 0. */
export function validateAmountInput(text: string): AmountInputResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: false, message: t('validation.amountRequired') };
  }
  const amount = parseAmountInput(trimmed);
  if (amount === null) {
    return { ok: false, message: t('validation.amountInvalid') };
  }
  if (amount <= 0) {
    return { ok: false, message: t('validation.amountPositive') };
  }
  return { ok: true, amount };
}
