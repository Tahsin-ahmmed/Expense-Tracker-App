import { z } from 'zod';

import { CURRENCY_CODES } from '@/domain/currency';
import { isIsoDate, type IsoDate } from '@/domain/date';
import { formatMoney, toMinor } from '@/domain/money';
import {
  DISPLAY_NAME_MAX_LENGTH,
  type Profile,
  type ProfileUpdate,
  type Weekday,
} from '@/domain/profile';
import { t } from '@/i18n';
import { parseSignedAmountInput } from '@/lib/amountInput';

export interface ProfileFormValues {
  displayName: string;
  currency: (typeof CURRENCY_CODES)[number];
  /** Empty means "no opening balance yet". */
  openingBalance: string;
  openingBalanceDate: string;
  weekStartsOn: WeekStartChoice;
}

/** Week-start options offered in the app: Saturday (common in Bangladesh), Sunday, Monday. */
export const WEEK_START_CHOICES = [6, 0, 1] as const;
export type WeekStartChoice = (typeof WEEK_START_CHOICES)[number];

function toWeekStartChoice(day: Weekday): WeekStartChoice {
  return (WEEK_START_CHOICES as readonly number[]).includes(day) ? (day as WeekStartChoice) : 6;
}

export function toProfileFormValues(profile: Profile, today: IsoDate): ProfileFormValues {
  return {
    displayName: profile.displayName ?? '',
    currency: profile.currency,
    openingBalance: profile.openingBalanceDate
      ? formatMoney(profile.openingBalance, {
          currency: profile.currency,
          showSymbol: false,
          decimals: 'auto',
        })
      : '',
    openingBalanceDate: profile.openingBalanceDate ?? today,
    weekStartsOn: toWeekStartChoice(profile.weekStartsOn),
  };
}

/** Validates the profile form and converts it to a full profile update. */
export function createProfileFormSchema(today: IsoDate) {
  return z
    .object({
      displayName: z.string(),
      currency: z.enum(CURRENCY_CODES),
      openingBalance: z.string(),
      openingBalanceDate: z.string(),
      weekStartsOn: z.union([z.literal(6), z.literal(0), z.literal(1)]),
    })
    .superRefine((values, ctx) => {
      if (values.displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
        ctx.addIssue({ code: 'custom', path: ['displayName'], message: t('profile.nameTooLong') });
      }
      if (values.openingBalance.trim() !== '') {
        if (parseSignedAmountInput(values.openingBalance) === null) {
          ctx.addIssue({
            code: 'custom',
            path: ['openingBalance'],
            message: t('profile.openingBalanceInvalid'),
          });
        }
        if (!isIsoDate(values.openingBalanceDate)) {
          ctx.addIssue({
            code: 'custom',
            path: ['openingBalanceDate'],
            message: t('validation.dateInvalid'),
          });
        } else if (values.openingBalanceDate > today) {
          ctx.addIssue({
            code: 'custom',
            path: ['openingBalanceDate'],
            message: t('validation.dateFuture'),
          });
        }
      }
    })
    .transform((values): ProfileUpdate => {
      const name = values.displayName.trim();
      const hasBalance = values.openingBalance.trim() !== '';
      const balance = hasBalance ? parseSignedAmountInput(values.openingBalance) : null;
      return {
        displayName: name === '' ? null : name,
        currency: values.currency,
        openingBalance: balance ?? toMinor(0),
        openingBalanceDate:
          hasBalance && isIsoDate(values.openingBalanceDate) ? values.openingBalanceDate : null,
        weekStartsOn: values.weekStartsOn,
      };
    });
}
