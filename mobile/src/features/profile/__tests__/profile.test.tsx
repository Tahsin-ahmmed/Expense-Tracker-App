import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { ProfileRepository } from '@/data/repositories';
import type { AppSupabaseClient } from '@/data/supabase/client';
import { createSupabaseProfileRepository } from '@/data/supabase/profileRepository';
import type { IsoDate } from '@/domain/date';
import { toMinor } from '@/domain/money';
import { DEFAULT_PROFILE, type Profile } from '@/domain/profile';
import { parseSignedAmountInput } from '@/lib/amountInput';

import { ProfileForm } from '../components/ProfileForm';
import { createProfileFormSchema, toProfileFormValues } from '../schema';
import { createProfileStore } from '../store';

const today = '2026-11-12' as IsoDate;

describe('parseSignedAmountInput', () => {
  it.each([
    ['25000', 2500000],
    ['-500', -50000],
    ['−1,250.50', -125050],
    ['-৳500', -50000],
    ['-0', 0],
  ])('%j → %i', (input, expected) => {
    expect(parseSignedAmountInput(input)).toBe(expected);
  });

  it('rejects malformed input', () => {
    expect(parseSignedAmountInput('--5')).toBeNull();
    expect(parseSignedAmountInput('abc')).toBeNull();
  });
});

describe('profile form schema', () => {
  const schema = createProfileFormSchema(today);
  const base = toProfileFormValues(DEFAULT_PROFILE, today);

  it('starts empty with today as the balance date', () => {
    expect(base).toEqual({
      displayName: '',
      currency: 'BDT',
      openingBalance: '',
      openingBalanceDate: today,
      weekStartsOn: 6,
    });
  });

  it('leaves the opening balance unset when the amount is empty', () => {
    expect(schema.parse(base)).toMatchObject({
      displayName: null,
      openingBalance: 0,
      openingBalanceDate: null,
    });
  });

  it('saves a trimmed name, currency and a (possibly negative) opening balance', () => {
    expect(
      schema.parse({
        ...base,
        displayName: '  Rahim ',
        currency: 'USD',
        openingBalance: '-1,250.50',
        openingBalanceDate: '2026-11-01',
        weekStartsOn: 1,
      }),
    ).toEqual({
      displayName: 'Rahim',
      currency: 'USD',
      openingBalance: -125050,
      openingBalanceDate: '2026-11-01',
      weekStartsOn: 1,
    });
  });

  it('rejects a bad amount or a future balance date', () => {
    expect(schema.safeParse({ ...base, openingBalance: '12abc' }).success).toBe(false);
    expect(
      schema.safeParse({ ...base, openingBalance: '100', openingBalanceDate: '2026-11-13' })
        .success,
    ).toBe(false);
  });
});

describe('Supabase profile repository', () => {
  function fakeClient(result: { data: unknown; error: unknown }) {
    const calls: { method: string; args: unknown[] }[] = [];
    const builder: Record<string, unknown> = {
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    for (const method of ['select', 'upsert', 'maybeSingle', 'single']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ method, args });
        return builder;
      };
    }
    const client = {
      from: () => builder,
      rpc: (name: string) => {
        calls.push({ method: 'rpc', args: [name] });
        return Promise.resolve(result);
      },
    } as unknown as AppSupabaseClient;
    return { client, calls };
  }

  const row = {
    display_name: 'Rahim',
    currency: 'USD',
    opening_balance_minor: 2500000,
    opening_balance_date: '2026-11-01',
    theme: 'dark',
    week_starts_on: 0,
  };

  it('returns defaults when the user has no profile row yet', async () => {
    const { client } = fakeClient({ data: null, error: null });
    const repo = createSupabaseProfileRepository(
      () => client,
      async () => 'u',
    );
    await expect(repo.get()).resolves.toEqual(DEFAULT_PROFILE);
  });

  it('maps a row and falls back to defaults for unknown values', async () => {
    const { client } = fakeClient({
      data: { ...row, currency: 'XYZ', theme: 'neon' },
      error: null,
    });
    const repo = createSupabaseProfileRepository(
      () => client,
      async () => 'u',
    );
    await expect(repo.get()).resolves.toEqual({
      displayName: 'Rahim',
      currency: 'BDT',
      openingBalance: 2500000,
      openingBalanceDate: '2026-11-01',
      theme: 'system',
      weekStartsOn: 0,
    });
  });

  it('upserts only the changed fields with the user id', async () => {
    const { client, calls } = fakeClient({ data: row, error: null });
    const repo = createSupabaseProfileRepository(
      () => client,
      async () => 'user-1',
    );

    await repo.update({ currency: 'USD', openingBalance: toMinor(2500000) });

    expect(calls.find((c) => c.method === 'upsert')?.args).toEqual([
      { user_id: 'user-1', currency: 'USD', opening_balance_minor: 2500000 },
      { onConflict: 'user_id' },
    ]);
  });

  it('deletes the account through the database function', async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    await createSupabaseProfileRepository(
      () => client,
      async () => 'u',
    ).deleteAccount();
    expect(calls).toContainEqual({ method: 'rpc', args: ['delete_my_account'] });
  });
});

describe('profile store', () => {
  function fakeRepo(overrides: Partial<ProfileRepository> = {}): ProfileRepository {
    return {
      get: jest.fn().mockResolvedValue(DEFAULT_PROFILE),
      update: jest.fn(async (update) => ({ ...DEFAULT_PROFILE, ...update })),
      deleteAccount: jest.fn(),
      ...overrides,
    };
  }

  it('loads, updates and resets', async () => {
    const store = createProfileStore(fakeRepo());
    await store.getState().load();
    expect(store.getState().status).toBe('ready');

    await store.getState().update({ currency: 'EUR' });
    expect(store.getState().profile.currency).toBe('EUR');

    store.getState().reset();
    expect(store.getState()).toMatchObject({ status: 'idle', profile: DEFAULT_PROFILE });
  });

  it('ignores a profile that arrives after an account switch', async () => {
    let finish: (p: Profile) => void = () => {};
    const store = createProfileStore(
      fakeRepo({ get: jest.fn(() => new Promise<Profile>((resolve) => (finish = resolve))) }),
    );
    const pending = store.getState().load();
    store.getState().reset();
    finish({ ...DEFAULT_PROFILE, displayName: 'Previous user' });
    await pending;
    expect(store.getState().profile.displayName).toBeNull();
  });
});

describe('ProfileForm', () => {
  afterEach(() => jest.restoreAllMocks());

  it('asks before changing currency and saves after confirmation', async () => {
    // Simulate the user tapping "Change" in the confirmation dialog.
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === 'Change')?.onPress?.();
    });
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(<ProfileForm profile={DEFAULT_PROFILE} today={today} onSave={onSave} />);

    await fireEvent.press(screen.getByTestId('currency-USD'));
    await fireEvent.changeText(screen.getByTestId('opening-balance-input'), '25000');
    await fireEvent.press(screen.getByTestId('save-profile'));
    await screen.findByTestId('save-profile');

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][1]).toContain('$1,000.00');
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'USD',
        openingBalance: 2500000,
        openingBalanceDate: today,
      }),
    );
  });

  it('does not save when the currency change is cancelled', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.style === 'cancel')?.onPress?.();
    });
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(<ProfileForm profile={DEFAULT_PROFILE} today={today} onSave={onSave} />);

    await fireEvent.press(screen.getByTestId('currency-EUR'));
    await fireEvent.press(screen.getByTestId('save-profile'));
    await screen.findByTestId('save-profile');

    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves without asking when the currency is unchanged', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(<ProfileForm profile={DEFAULT_PROFILE} today={today} onSave={onSave} />);

    await fireEvent.changeText(screen.getByTestId('name-input'), 'Rahim');
    await fireEvent.press(screen.getByTestId('save-profile'));
    await screen.findByTestId('save-profile');

    expect(alert).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Rahim' }));
  });
});
