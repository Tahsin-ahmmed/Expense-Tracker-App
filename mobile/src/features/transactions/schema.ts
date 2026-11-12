import { z } from 'zod';

import { isCategoryForType, isCategoryId } from '@/domain/category';
import { isIsoDate, type IsoDate } from '@/domain/date';
import { parseTakaInput } from '@/domain/money';
import {
  NOTE_MAX_LENGTH,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  type NewTransaction,
} from '@/domain/transaction';
import { t } from '@/i18n';

/** Raw values held by the form while the user edits. */
export interface TransactionFormValues {
  type: (typeof TRANSACTION_TYPES)[number];
  amount: string;
  categoryId: string;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  occurredOn: string;
  note: string;
}

/**
 * Validates the add-transaction form and converts it to a `NewTransaction`.
 * `today` (Dhaka) is passed in so "no future dates" is testable.
 */
export function createTransactionFormSchema(today: IsoDate) {
  return z
    .object({
      type: z.enum(TRANSACTION_TYPES),
      amount: z.string(),
      categoryId: z.string(),
      paymentMethod: z.enum(PAYMENT_METHODS),
      occurredOn: z.string(),
      note: z.string(),
    })
    .superRefine((values, ctx) => {
      const amountText = values.amount.trim();
      const amount = parseTakaInput(amountText);
      if (amountText === '') {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: t('validation.amountRequired') });
      } else if (amount === null) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: t('validation.amountInvalid') });
      } else if (amount <= 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: t('validation.amountPositive') });
      }

      if (!isCategoryId(values.categoryId) || !isCategoryForType(values.categoryId, values.type)) {
        ctx.addIssue({
          code: 'custom',
          path: ['categoryId'],
          message: t('validation.categoryRequired'),
        });
      }

      if (!isIsoDate(values.occurredOn)) {
        ctx.addIssue({
          code: 'custom',
          path: ['occurredOn'],
          message: t('validation.dateInvalid'),
        });
      } else if (values.occurredOn > today) {
        ctx.addIssue({ code: 'custom', path: ['occurredOn'], message: t('validation.dateFuture') });
      }

      if (values.note.trim().length > NOTE_MAX_LENGTH) {
        ctx.addIssue({ code: 'custom', path: ['note'], message: t('validation.noteTooLong') });
      }
    })
    .transform((values): NewTransaction => {
      // superRefine guarantees these checks pass before transform runs.
      const amount = parseTakaInput(values.amount);
      if (amount === null || !isCategoryId(values.categoryId) || !isIsoDate(values.occurredOn)) {
        throw new Error('Unreachable: transaction form values were not validated');
      }
      const note = values.note.trim();
      return {
        type: values.type,
        amount,
        categoryId: values.categoryId,
        paymentMethod: values.paymentMethod,
        occurredOn: values.occurredOn,
        note: note === '' ? null : note,
      };
    });
}
