import { z } from 'zod';

import { CURRENCY_CODES } from '@/domain/currency';
import type { IsoDate } from '@/domain/date';
import { DISPLAY_NAME_MAX_LENGTH, type ProfileUpdate } from '@/domain/profile';
import { t } from '@/i18n';
import { parseSignedAmountInput } from '@/lib/amountInput';

export interface WelcomeValues {
  displayName: string;
  currency: (typeof CURRENCY_CODES)[number];
  balance: string;
}

/**
 * First-run setup. The balance is required (0 allowed) and applies from
 * today: saving it is what marks setup as done.
 */
export function createWelcomeSchema(today: IsoDate) {
  return z
    .object({
      displayName: z.string(),
      currency: z.enum(CURRENCY_CODES),
      balance: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
        ctx.addIssue({ code: 'custom', path: ['displayName'], message: t('profile.nameTooLong') });
      }
      if (values.balance.trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['balance'], message: t('welcome.balanceRequired') });
      } else if (parseSignedAmountInput(values.balance) === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['balance'],
          message: t('profile.openingBalanceInvalid'),
        });
      }
    })
    .transform((values): ProfileUpdate => {
      const balance = parseSignedAmountInput(values.balance);
      if (balance === null) {
        throw new Error('Unreachable: welcome form was not validated');
      }
      const name = values.displayName.trim();
      return {
        displayName: name === '' ? null : name,
        currency: values.currency,
        openingBalance: balance,
        openingBalanceDate: today,
      };
    });
}
