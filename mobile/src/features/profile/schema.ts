import { z } from 'zod';

import { CURRENCY_CODES } from '@/domain/currency';
import {
  DISPLAY_NAME_MAX_LENGTH,
  type Profile,
  type ProfileUpdate,
  type Weekday,
} from '@/domain/profile';
import { formatMoney, toMinor } from '@/domain/money';
import { t } from '@/i18n';
import { parseSignedAmountInput } from '@/lib/amountInput';

/** Week-start options offered in the app: Saturday (common in Bangladesh), Sunday, Monday. */
export const WEEK_START_CHOICES = [6, 0, 1] as const;
export type WeekStartChoice = (typeof WEEK_START_CHOICES)[number];

export interface ProfileFormValues {
  displayName: string;
  currency: (typeof CURRENCY_CODES)[number];
  /** Added to the balance; may be negative. Empty means 0. */
  openingBalance: string;
  weekStartsOn: WeekStartChoice;
}

function toWeekStartChoice(day: Weekday): WeekStartChoice {
  return (WEEK_START_CHOICES as readonly number[]).includes(day) ? (day as WeekStartChoice) : 6;
}

export function toProfileFormValues(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName ?? '',
    currency: profile.currency,
    openingBalance: formatMoney(profile.openingBalance, {
      currency: profile.currency,
      showSymbol: false,
      decimals: 'auto',
    }),
    weekStartsOn: toWeekStartChoice(profile.weekStartsOn),
  };
}

/**
 * Validates Profile & preferences. The opening balance is simply added to the
 * balance (current balance = opening balance + income − expense).
 */
export const profileFormSchema = z
  .object({
    displayName: z.string(),
    currency: z.enum(CURRENCY_CODES),
    openingBalance: z.string(),
    weekStartsOn: z.union([z.literal(6), z.literal(0), z.literal(1)]),
  })
  .superRefine((values, ctx) => {
    if (values.displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
      ctx.addIssue({ code: 'custom', path: ['displayName'], message: t('profile.nameTooLong') });
    }
    if (
      values.openingBalance.trim() !== '' &&
      parseSignedAmountInput(values.openingBalance) === null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['openingBalance'],
        message: t('profile.openingBalanceInvalid'),
      });
    }
  })
  .transform((values): ProfileUpdate => {
    const name = values.displayName.trim();
    return {
      displayName: name === '' ? null : name,
      currency: values.currency,
      openingBalance:
        values.openingBalance.trim() === ''
          ? toMinor(0)
          : (parseSignedAmountInput(values.openingBalance) ?? toMinor(0)),
      weekStartsOn: values.weekStartsOn,
    };
  });
