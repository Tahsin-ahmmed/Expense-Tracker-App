import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthFailure, createAuthService, toAuthFailure } from '../authService';
import { createAuthStore } from '../store';

const session = { user: { id: 'user-1', email: 'me@mail.com', phone: '' } } as unknown as Session;

function fakeClient(overrides: Record<string, jest.Mock> = {}) {
  const auth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { session }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { session }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    exchangeCodeForSession: jest.fn().mockResolvedValue({ data: { session }, error: null }),
    updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    ...overrides,
  };
  return { auth, client: { auth } as unknown as SupabaseClient };
}

describe('toAuthFailure', () => {
  it.each([
    [{ code: 'invalid_credentials' }, 'invalid_credentials', 'Wrong email, phone number or PIN.'],
    [{ code: 'user_already_exists' }, 'already_registered', expect.any(String)],
    [{ code: 'phone_exists' }, 'already_registered', expect.any(String)],
    [{ code: 'over_request_rate_limit' }, 'rate_limited', expect.any(String)],
    [{ code: 'flow_state_not_found' }, 'reset_link_invalid', expect.any(String)],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 'network', expect.any(String)],
    [
      { code: 'something_new', message: 'raw server text' },
      'unknown',
      'Something went wrong. Please try again.',
    ],
  ])('maps %j', (error, reason, message) => {
    const failure = toAuthFailure(error);
    expect(failure.reason).toBe(reason);
    expect(failure.message).toEqual(message);
  });
});

describe('auth service', () => {
  it('signs in with phone or email using the PIN as the password', async () => {
    const { auth, client } = fakeClient();
    const service = createAuthService(() => client);

    await service.signIn({ kind: 'phone', phone: '+8801712345678' }, '482915');
    await service.signIn({ kind: 'email', email: 'me@mail.com' }, '482915');

    expect(auth.signInWithPassword.mock.calls).toEqual([
      [{ phone: '+8801712345678', password: '482915' }],
      [{ email: 'me@mail.com', password: '482915' }],
    ]);
  });

  it('throws a friendly failure when Supabase returns an error', async () => {
    const { client } = fakeClient({
      signInWithPassword: jest
        .fn()
        .mockResolvedValue({ data: {}, error: { code: 'invalid_credentials' } }),
    });
    const service = createAuthService(() => client);

    await expect(service.signIn({ kind: 'email', email: 'x@y.com' }, '000000')).rejects.toEqual(
      expect.objectContaining({ reason: 'invalid_credentials' }),
    );
  });

  it('maps thrown network errors too', async () => {
    const { client } = fakeClient({
      signOut: jest.fn().mockRejectedValue({ name: 'AuthRetryableFetchError', status: 0 }),
    });
    await expect(createAuthService(() => client).signOut()).rejects.toBeInstanceOf(AuthFailure);
  });

  it('reports when sign-up needs confirmation (no session returned)', async () => {
    const { client } = fakeClient({
      signUp: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    });
    await expect(
      createAuthService(() => client).signUp({ kind: 'email', email: 'a@b.com' }, '482915'),
    ).rejects.toEqual(expect.objectContaining({ reason: 'confirmation_required' }));
  });

  it('requests a reset with the app redirect and updates the PIN', async () => {
    const { auth, client } = fakeClient();
    const service = createAuthService(() => client);

    await service.requestPinReset('me@mail.com', 'hisabbondhu://reset-pin');
    await service.exchangeResetCode('code-123');
    await service.updatePin('730184');

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('me@mail.com', {
      redirectTo: 'hisabbondhu://reset-pin',
    });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('code-123');
    expect(auth.updateUser).toHaveBeenCalledWith({ password: '730184' });
  });
});

describe('auth store', () => {
  it('starts initializing, then reflects the saved session and later changes', async () => {
    let listener: (s: Session | null) => void = () => {};
    const store = createAuthStore({
      getSession: jest.fn().mockResolvedValue(session),
      onSessionChange: (l: (s: Session | null) => void) => {
        listener = l;
        return () => {};
      },
    } as never);

    expect(store.getState().status).toBe('initializing');
    await store.getState().initialize();
    expect(store.getState()).toMatchObject({
      status: 'signedIn',
      user: { id: 'user-1', email: 'me@mail.com', phone: null },
    });

    listener(null);
    expect(store.getState()).toMatchObject({ status: 'signedOut', user: null });
  });

  it('starts signed out when the saved session cannot be read', async () => {
    const store = createAuthStore({
      getSession: jest.fn().mockRejectedValue(new Error('corrupt')),
      onSessionChange: () => () => {},
    } as never);

    await store.getState().initialize();

    expect(store.getState().status).toBe('signedOut');
  });
});
