import { parseTakaInput, type Poisha } from '@/domain/money';
import { t } from '@/i18n';

export type AmountInputResult = { ok: true; amount: Poisha } | { ok: false; message: string };

/** Validates a typed Taka amount: required, well-formed, more than ৳0. */
export function validateAmountInput(text: string): AmountInputResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: false, message: t('validation.amountRequired') };
  }
  const amount = parseTakaInput(trimmed);
  if (amount === null) {
    return { ok: false, message: t('validation.amountInvalid') };
  }
  if (amount <= 0) {
    return { ok: false, message: t('validation.amountPositive') };
  }
  return { ok: true, amount };
}
