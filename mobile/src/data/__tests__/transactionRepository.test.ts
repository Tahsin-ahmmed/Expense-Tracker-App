import type { SQLiteDatabase } from 'expo-sqlite';

import type { IsoDate } from '@/domain/date';
import { toPoisha } from '@/domain/money';

import { createSqliteTransactionRepository } from '../transactionRepository';

function setup(rows: unknown[] = []) {
  const db = {
    getAllAsync: jest.fn().mockResolvedValue(rows),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
  };
  const repository = createSqliteTransactionRepository({
    getDatabase: async () => db as unknown as SQLiteDatabase,
    generateId: () => 'id-1',
    now: () => new Date('2026-11-12T04:30:00.000Z'),
  });
  return { db, repository };
}

const validRow = {
  id: 'a',
  type: 'expense',
  amount_poisha: 125050,
  category_id: 'food',
  payment_method: 'nagad',
  note: 'Lunch',
  occurred_on: '2026-11-12',
  created_at: '2026-11-12T04:00:00.000Z',
};

describe('SQLite transaction repository', () => {
  it('maps rows to transactions', async () => {
    const { repository } = setup([validRow]);

    await expect(repository.listAll()).resolves.toEqual([
      {
        id: 'a',
        type: 'expense',
        amount: 125050,
        categoryId: 'food',
        paymentMethod: 'nagad',
        note: 'Lunch',
        occurredOn: '2026-11-12',
        createdAt: '2026-11-12T04:00:00.000Z',
      },
    ]);
  });

  it('skips rows that break domain rules instead of crashing', async () => {
    const { repository } = setup([
      validRow,
      { ...validRow, id: 'bad-type', type: 'transfer' },
      { ...validRow, id: 'bad-amount', amount_poisha: 10.5 },
      { ...validRow, id: 'bad-category', category_id: 'unknown' },
      { ...validRow, id: 'bad-date', occurred_on: '2026-13-01' },
    ]);

    const result = await repository.listAll();
    expect(result.map((tx) => tx.id)).toEqual(['a']);
  });

  it('inserts with parameter binding and assigns id and timestamp', async () => {
    const { db, repository } = setup();

    const saved = await repository.create({
      type: 'income',
      amount: toPoisha(5000000),
      categoryId: 'salary',
      paymentMethod: 'bank',
      note: null,
      occurredOn: '2026-11-01' as IsoDate,
    });

    expect(saved).toMatchObject({ id: 'id-1', createdAt: '2026-11-12T04:30:00.000Z' });
    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('INSERT INTO transactions');
    expect(params).toEqual([
      'id-1',
      'income',
      5000000,
      'salary',
      'bank',
      null,
      '2026-11-01',
      '2026-11-12T04:30:00.000Z',
    ]);
  });
});
