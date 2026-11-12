import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';

import { t, type TranslationKey } from '@/i18n';

import type { Identifier } from './identifier';

export type AuthFailureReason =
  | 'invalid_credentials'
  | 'already_registered'
  | 'weak_pin'
  | 'same_pin'
  | 'rate_limited'
  | 'network'
  | 'confirmation_required'
  | 'reset_link_invalid'
  | 'unknown';

const MESSAGE_KEYS: Record<AuthFailureReason, TranslationKey> = {
  invalid_credentials: 'auth.error.invalidCredentials',
  already_registered: 'auth.error.alreadyRegistered',
  weak_pin: 'auth.error.weakPin',
  same_pin: 'auth.error.samePin',
  rate_limited: 'auth.error.rateLimited',
  network: 'auth.error.network',
  confirmation_required: 'auth.error.confirmationRequired',
  reset_link_invalid: 'auth.error.resetLinkInvalid',
  unknown: 'auth.error.unknown',
};

/** An auth failure with a user-friendly, translatable message. */
export class AuthFailure extends Error {
  constructor(readonly reason: AuthFailureReason) {
    super(t(MESSAGE_KEYS[reason]));
    this.name = 'AuthFailure';
  }
}

/** Maps Supabase errors to reasons. Never exposes raw server messages to users. */
export function toAuthFailure(error: unknown): AuthFailure {
  if (error instanceof AuthFailure) {
    return error;
  }
  const authError = error as Partial<AuthError> | null;
  switch (authError?.code) {
    case 'invalid_credentials':
      return new AuthFailure('invalid_credentials');
    case 'user_already_exists':
    case 'email_exists':
    case 'phone_exists':
      return new AuthFailure('already_registered');
    case 'weak_password':
      return new AuthFailure('weak_pin');
    case 'same_password':
      return new AuthFailure('same_pin');
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
    case 'over_sms_send_rate_limit':
      return new AuthFailure('rate_limited');
    case 'flow_state_not_found':
    case 'flow_state_expired':
    case 'bad_code_verifier':
    case 'otp_expired':
      return new AuthFailure('reset_link_invalid');
  }
  if (authError?.name === 'AuthRetryableFetchError' || authError?.status === 0) {
    return new AuthFailure('network');
  }
  return new AuthFailure('unknown');
}

function credentialsFor(identifier: Identifier, pin: string) {
  return identifier.kind === 'email'
    ? { email: identifier.email, password: pin }
    : { phone: identifier.phone, password: pin };
}

export interface AuthService {
  getSession(): Promise<Session | null>;
  signIn(identifier: Identifier, pin: string): Promise<void>;
  signUp(identifier: Identifier, pin: string): Promise<void>;
  signOut(): Promise<void>;
  /** Emails a PIN reset link that opens `redirectTo` in the app. */
  requestPinReset(email: string, redirectTo: string): Promise<void>;
  /** Signs in using the `code` from a reset link (PKCE). */
  exchangeResetCode(code: string): Promise<void>;
  /** Sets a new PIN for the signed-in user. */
  updatePin(pin: string): Promise<void>;
  onSessionChange(listener: (session: Session | null) => void): () => void;
}

/** Thin wrapper over Supabase Auth that throws `AuthFailure` on every error. */
export function createAuthService(getClient: () => SupabaseClient): AuthService {
  const run = async (action: () => Promise<{ error: AuthError | null }>) => {
    let result: { error: AuthError | null };
    try {
      result = await action();
    } catch (error) {
      throw toAuthFailure(error);
    }
    if (result.error) {
      throw toAuthFailure(result.error);
    }
  };

  return {
    async getSession() {
      const { data } = await getClient().auth.getSession();
      return data.session;
    },

    signIn: (identifier, pin) =>
      run(() => getClient().auth.signInWithPassword(credentialsFor(identifier, pin))),

    async signUp(identifier, pin) {
      let session: Session | null = null;
      await run(async () => {
        const result = await getClient().auth.signUp(credentialsFor(identifier, pin));
        session = result.data.session;
        return result;
      });
      // With confirmations off Supabase signs the user in immediately.
      // A missing session means the project requires confirmation.
      if (!session) {
        throw new AuthFailure('confirmation_required');
      }
    },

    signOut: () => run(() => getClient().auth.signOut()),

    requestPinReset: (email, redirectTo) =>
      run(() => getClient().auth.resetPasswordForEmail(email, { redirectTo })),

    exchangeResetCode: (code) => run(() => getClient().auth.exchangeCodeForSession(code)),

    updatePin: (pin) => run(() => getClient().auth.updateUser({ password: pin })),

    onSessionChange(listener) {
      const { data } = getClient().auth.onAuthStateChange((_event, session) => listener(session));
      return () => data.subscription.unsubscribe();
    },
  };
}
