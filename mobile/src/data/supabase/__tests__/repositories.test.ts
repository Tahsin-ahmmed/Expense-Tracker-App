import type { MonthKey, IsoDate } from '@/domain/date';
import { toMinor } from '@/domain/money';

import { NotFoundError } from '../../repositories';
import { createSupabaseBudgetRepository } from '../budgetRepository';
import type { AppSupabaseClient } from '../client';
import { createSupabaseTransactionRepository } from '../transactionRepository';

interface Call {
  method: string;
  args: unknown[];
}

/** Chainable stand-in for the Supabase query builder that records calls. */
function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'order',
    'single',
  ]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  const client = {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return builder;
    },
  } as unknown as AppSupabaseClient;
  return { client, calls };
}

const row = {
  id: 'tx-1',
  type: 'expense',
  amount_poisha: 125050,
  category_id: 'food',
  payment_method: 'bkash',
  note: 'Lunch',
  occurred_on: '2026-11-12',
  created_at: '2026-11-12T04:00:00+00:00',
};

const input = {
  type: 'expense' as const,
  amount: toMinor(125050),
  categoryId: 'food' as const,
  paymentMethod: 'bkash' as const,
  note: 'Lunch',
  occurredOn: '2026-11-12' as IsoDate,
};

describe('Supabase transaction repository', () => {
  it('lists newest first and skips invalid rows', async () => {
    const { client, calls } = fakeClient({
      data: [row, { ...row, id: 'bad', category_id: 'unknown' }],
      error: null,
    });

    const result = await createSupabaseTransactionRepository(() => client).listAll();

    expect(result.map((tx) => tx.id)).toEqual(['tx-1']);
    expect(result[0]).toMatchObject({
      amount: 125050,
      categoryId: 'food',
      occurredOn: '2026-11-12',
    });
    expect(calls.filter((c) => c.method === 'order').map((c) => c.args)).toEqual([
      ['occurred_on', { ascending: false }],
      ['created_at', { ascending: false }],
    ]);
  });

  it('inserts snake_case columns without a user_id (the database sets it)', async () => {
    const { client, calls } = fakeClient({ data: row, error: null });

    const saved = await createSupabaseTransactionRepository(() => client).create(input);

    expect(saved.id).toBe('tx-1');
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toEqual({
      type: 'expense',
      amount_poisha: 125050,
      category_id: 'food',
      payment_method: 'bkash',
      note: 'Lunch',
      occurred_on: '2026-11-12',
    });
  });

  it('throws NotFoundError when update or delete matches no row', async () => {
    const { client } = fakeClient({ data: [], error: null });
    const repository = createSupabaseTransactionRepository(() => client);

    await expect(repository.update('gone', input)).rejects.toBeInstanceOf(NotFoundError);
    await expect(repository.remove('gone')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('passes database errors through', async () => {
    const dbError = { code: '23514', message: 'check violation' };
    const { client } = fakeClient({ data: null, error: dbError });

    await expect(createSupabaseTransactionRepository(() => client).listAll()).rejects.toBe(dbError);
  });
});

describe('Supabase budget repository', () => {
  it('converts first-of-month dates to month keys and skips invalid rows', async () => {
    const { client } = fakeClient({
      data: [
        { scope: 'food', effective_from: '2026-11-01', limit_poisha: 500000, updated_at: 'x' },
        { scope: 'overall', effective_from: '2026-10-01', limit_poisha: null, updated_at: 'y' },
        { scope: 'salary', effective_from: '2026-11-01', limit_poisha: 1, updated_at: 'z' },
        { scope: 'food', effective_from: '2026-11-15', limit_poisha: 1, updated_at: 'z' },
      ],
      error: null,
    });

    const entries = await createSupabaseBudgetRepository(
      () => client,
      async () => 'user-1',
    ).listAll();

    expect(entries).toEqual([
      { scope: 'food', effectiveFrom: '2026-11', limit: 500000, updatedAt: 'x' },
      { scope: 'overall', effectiveFrom: '2026-10', limit: null, updatedAt: 'y' },
    ]);
  });

  it('upserts on the user, scope and month', async () => {
    const { client, calls } = fakeClient({
      data: { scope: 'food', effective_from: '2026-11-01', limit_poisha: 600000, updated_at: 'u' },
      error: null,
    });

    const saved = await createSupabaseBudgetRepository(
      () => client,
      async () => 'user-1',
    ).setLimit('food', '2026-11' as MonthKey, toMinor(600000));

    expect(saved).toEqual({
      scope: 'food',
      effectiveFrom: '2026-11',
      limit: 600000,
      updatedAt: 'u',
    });
    expect(calls.find((c) => c.method === 'upsert')?.args).toEqual([
      { user_id: 'user-1', scope: 'food', effective_from: '2026-11-01', limit_poisha: 600000 },
      { onConflict: 'user_id,scope,effective_from' },
    ]);
  });
});
