import { z } from 'zod';

import { t } from '@/i18n';

import { parseIdentifier, type Identifier } from './identifier';
import { isPinFormat, isWeakPin } from './pin';

export interface SignInValues {
  identifier: string;
  pin: string;
}

export interface SignUpValues {
  identifier: string;
  pin: string;
  confirmPin: string;
}

export interface NewPinValues {
  pin: string;
  confirmPin: string;
}

export interface ForgotPinValues {
  email: string;
}

export interface Credentials {
  identifier: Identifier;
  pin: string;
}

function checkIdentifier(value: string, ctx: z.RefinementCtx) {
  if (value.trim() === '') {
    ctx.addIssue({ code: 'custom', path: ['identifier'], message: t('auth.identifierRequired') });
  } else if (!parseIdentifier(value)) {
    ctx.addIssue({ code: 'custom', path: ['identifier'], message: t('auth.identifierInvalid') });
  }
}

/** New PIN rules: exactly 6 digits, not easy to guess, entered twice the same. */
function checkNewPin(values: { pin: string; confirmPin: string }, ctx: z.RefinementCtx) {
  if (!isPinFormat(values.pin)) {
    ctx.addIssue({ code: 'custom', path: ['pin'], message: t('auth.pinFormat') });
  } else if (isWeakPin(values.pin)) {
    ctx.addIssue({ code: 'custom', path: ['pin'], message: t('auth.pinWeak') });
  } else if (values.confirmPin !== values.pin) {
    ctx.addIssue({ code: 'custom', path: ['confirmPin'], message: t('auth.pinMismatch') });
  }
}

function toCredentials(identifier: string, pin: string): Credentials {
  const parsed = parseIdentifier(identifier);
  if (!parsed) {
    throw new Error('Unreachable: identifier was not validated');
  }
  return { identifier: parsed, pin };
}

/** Log in: any 6-digit PIN (weak-PIN rules apply only when choosing one). */
export const signInSchema = z
  .object({ identifier: z.string(), pin: z.string() })
  .superRefine((values, ctx) => {
    checkIdentifier(values.identifier, ctx);
    if (!isPinFormat(values.pin)) {
      ctx.addIssue({ code: 'custom', path: ['pin'], message: t('auth.pinFormat') });
    }
  })
  .transform((values): Credentials => toCredentials(values.identifier, values.pin));

export const signUpSchema = z
  .object({ identifier: z.string(), pin: z.string(), confirmPin: z.string() })
  .superRefine((values, ctx) => {
    checkIdentifier(values.identifier, ctx);
    checkNewPin(values, ctx);
  })
  .transform((values): Credentials => toCredentials(values.identifier, values.pin));

export const newPinSchema = z
  .object({ pin: z.string(), confirmPin: z.string() })
  .superRefine(checkNewPin)
  .transform((values) => values.pin);

/** PIN reset is only possible by email until SMS is set up. */
export const forgotPinSchema = z
  .object({ email: z.string() })
  .superRefine((values, ctx) => {
    const parsed = parseIdentifier(values.email);
    if (!parsed || parsed.kind !== 'email') {
      ctx.addIssue({ code: 'custom', path: ['email'], message: t('auth.emailInvalid') });
    }
  })
  .transform((values) => values.email.trim().toLowerCase());
