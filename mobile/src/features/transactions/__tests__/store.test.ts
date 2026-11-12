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
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

async function readyStore(overrides: Partial<TransactionRepository> = {}) {
  const repository = fakeRepository(overrides);
  const store = createTransactionsStore(repository);
  await store.getState().load();
  return { repository, store };
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

describe('transactions store: update and remove', () => {
  const lunch = makeTransaction({ id: 'lunch', occurredOn: '2026-11-05', amount: 20000 });
  const rent = makeTransaction({ id: 'rent', occurredOn: '2026-11-01', categoryId: 'rent' });

  it('updates a transaction and keeps newest-first order', async () => {
    const { repository, store } = await readyStore({
      listAll: jest.fn().mockResolvedValue([lunch, rent]),
    });

    const changes: NewTransaction = { ...newExpense, occurredOn: '2026-10-30' as IsoDate };
    await store.getState().update('lunch', changes);

    expect(repository.update).toHaveBeenCalledWith('lunch', changes);
    const updated = store.getState().transactions;
    expect(updated.map((tx) => tx.id)).toEqual(['rent', 'lunch']);
    expect(updated[1]).toMatchObject({
      id: 'lunch',
      amount: 5000,
      categoryId: 'transport',
      occurredOn: '2026-10-30',
      createdAt: lunch.createdAt,
    });
  });

  it('keeps the list unchanged when an update fails', async () => {
    const { store } = await readyStore({
      listAll: jest.fn().mockResolvedValue([lunch]),
      update: jest.fn().mockRejectedValue(new Error('disk')),
    });

    await expect(store.getState().update('lunch', newExpense)).rejects.toThrow('disk');
    expect(store.getState().transactions).toEqual([lunch]);
  });

  it('removes a transaction', async () => {
    const { repository, store } = await readyStore({
      listAll: jest.fn().mockResolvedValue([lunch, rent]),
    });

    await store.getState().remove('lunch');

    expect(repository.remove).toHaveBeenCalledWith('lunch');
    expect(store.getState().transactions.map((tx) => tx.id)).toEqual(['rent']);
  });

  it('keeps the transaction when deleting fails', async () => {
    const { store } = await readyStore({
      listAll: jest.fn().mockResolvedValue([lunch]),
      remove: jest.fn().mockRejectedValue(new Error('locked')),
    });

    await expect(store.getState().remove('lunch')).rejects.toThrow('locked');
    expect(store.getState().transactions).toEqual([lunch]);
  });
});
