import type { BudgetRepository } from '@/data';
import type { BudgetEntry } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import { toPoisha } from '@/domain/money';

import { createBudgetsStore } from '../store';

const nov = '2026-11' as MonthKey;

function fakeRepository(overrides: Partial<BudgetRepository> = {}): BudgetRepository {
  return {
    listAll: jest.fn().mockResolvedValue([]),
    setLimit: jest.fn(async (scope, effectiveFrom, limit) => ({
      scope,
      effectiveFrom,
      limit,
      updatedAt: '2026-11-12T00:00:00Z',
    })),
    ...overrides,
  };
}

const existing: BudgetEntry = {
  scope: 'food',
  effectiveFrom: nov,
  limit: toPoisha(500000),
  updatedAt: '2026-11-01T00:00:00Z',
};

describe('budgets store', () => {
  it('loads entries, and reports errors so the screen can retry', async () => {
    const listAll = jest
      .fn()
      .mockRejectedValueOnce(new Error('disk'))
      .mockResolvedValueOnce([existing]);
    const store = createBudgetsStore(fakeRepository({ listAll }));

    await store.getState().load();
    expect(store.getState().status).toBe('error');

    await store.getState().load();
    expect(store.getState()).toMatchObject({ status: 'ready', entries: [existing] });
  });

  it('replaces the entry for the same scope and month', async () => {
    const store = createBudgetsStore(
      fakeRepository({ listAll: jest.fn().mockResolvedValue([existing]) }),
    );
    await store.getState().load();

    await store.getState().setLimit('food', nov, toPoisha(700000));
    await store.getState().setLimit('overall', nov, toPoisha(3000000));

    const entries = store.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.scope === 'food')?.limit).toBe(700000);
  });

  it('keeps entries unchanged when saving fails', async () => {
    const store = createBudgetsStore(
      fakeRepository({
        listAll: jest.fn().mockResolvedValue([existing]),
        setLimit: jest.fn().mockRejectedValue(new Error('full')),
      }),
    );
    await store.getState().load();

    await expect(store.getState().setLimit('food', nov, null)).rejects.toThrow('full');
    expect(store.getState().entries).toEqual([existing]);
  });
});

describe('budgets store: reset on account change', () => {
  it('clears entries and ignores a load that finishes after the reset', async () => {
    let finishLoad: (entries: BudgetEntry[]) => void = () => {};
    const store = createBudgetsStore(
      fakeRepository({ listAll: jest.fn(() => new Promise((resolve) => (finishLoad = resolve))) }),
    );

    const pending = store.getState().load();
    store.getState().reset();
    finishLoad([existing]);
    await pending;

    expect(store.getState()).toMatchObject({ status: 'idle', entries: [] });
  });
});
