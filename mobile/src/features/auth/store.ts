import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { AuthService } from './authService';

export type AuthStatus = 'initializing' | 'signedOut' | 'signedIn';

/** The signed-in account, without tokens (tokens stay inside the Supabase client). */
export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Reads the saved session and starts listening for sign-in / sign-out. Call once. */
  initialize: () => Promise<void>;
}

function toUser(session: Session | null): AuthUser | null {
  if (!session) {
    return null;
  }
  const { id, email, phone } = session.user;
  return { id, email: email || null, phone: phone || null };
}

export function createAuthStore(service: AuthService) {
  let unsubscribe: (() => void) | null = null;

  return create<AuthState>()((set) => {
    const apply = (session: Session | null) => {
      const user = toUser(session);
      set((state) =>
        state.user?.id === user?.id && state.status !== 'initializing'
          ? state
          : { user, status: user ? 'signedIn' : 'signedOut' },
      );
    };

    return {
      status: 'initializing',
      user: null,

      async initialize() {
        if (unsubscribe) {
          return;
        }
        unsubscribe = service.onSessionChange(apply);
        try {
          apply(await service.getSession());
        } catch {
          // Unreadable saved session: start signed out.
          apply(null);
        }
      },
    };
  });
}
