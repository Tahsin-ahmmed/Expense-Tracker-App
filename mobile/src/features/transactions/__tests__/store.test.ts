import type { TransactionRepository } from '@/data';
import { toPoisha } from '@/domain/money';
import type { IsoDate } from '@/domain/date';
import type { NewTransaction } from '@/domain/transaction';
import { makeTransaction } from '@/test-utils/transactions';

import { createTransactionsStore } from '../store';

function fakeRepository(overrides: Partial<TransactionRepository> = {}): TransactionRepository {
  return {
    listAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(async (input: NewTransaction) => ({
      ...input,
      id: 'new',
      createdAt: '2026-11-12T10:00:00.000Z',
    })),
    ...overrides,
  };
}

const newExpense: NewTransaction = {
  type: 'expense',
  amount: toPoisha(5000),
  categoryId: 'transport',
  paymentMethod: 'cash',
  note: null,
  occurredOn: '2026-11-12' as IsoDate,
};

describe('transactions store', () => {
  it('loads transactions and becomes ready', async () => {
    const existing = [makeTransaction()];
    const store = createTransactionsStore(
      fakeRepository({ listAll: jest.fn().mockResolvedValue(existing) }),
    );

    expect(store.getState().status).toBe('idle');
    await store.getState().load();

    expect(store.getState().status).toBe('ready');
    expect(store.getState().transactions).toEqual(existing);
  });

  it('enters the error state when loading fails, and can retry', async () => {
    const listAll = jest.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValueOnce([]);
    const store = createTransactionsStore(fakeRepository({ listAll }));

    await store.getState().load();
    expect(store.getState().status).toBe('error');

    await store.getState().load();
    expect(store.getState().status).toBe('ready');
  });

  it('adds a saved transaction in newest-first order', async () => {
    const older = makeTransaction({ id: 'older', occurredOn: '2026-11-01' });
    const store = createTransactionsStore(
      fakeRepository({ listAll: jest.fn().mockResolvedValue([older]) }),
    );
    await store.getState().load();

    const saved = await store.getState().add(newExpense);

    expect(saved.id).toBe('new');
    expect(store.getState().transactions.map((tx) => tx.id)).toEqual(['new', 'older']);
  });

  it('leaves the list unchanged and rejects when saving fails', async () => {
    const store = createTransactionsStore(
      fakeRepository({ create: jest.fn().mockRejectedValue(new Error('full')) }),
    );
    await store.getState().load();

    await expect(store.getState().add(newExpense)).rejects.toThrow('full');
    expect(store.getState().transactions).toEqual([]);
  });
});
