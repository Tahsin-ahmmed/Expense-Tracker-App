import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthKey } from '@/domain/date';
import { toPoisha } from '@/domain/money';

import { createSqliteBudgetRepository } from '../budgetRepository';

function setup(rows: unknown[] = []) {
  const db = {
    getAllAsync: jest.fn().mockResolvedValue(rows),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
  };
  const repository = createSqliteBudgetRepository({
    getDatabase: async () => db as unknown as SQLiteDatabase,
    now: () => new Date('2026-11-12T04:30:00.000Z'),
  });
  return { db, repository };
}

describe('SQLite budget repository', () => {
  it('maps rows and skips invalid ones', async () => {
    const { repository } = setup([
      { scope: 'food', effective_from: '2026-11', limit_poisha: 500000, updated_at: 'x' },
      { scope: 'overall', effective_from: '2026-10', limit_poisha: null, updated_at: 'y' },
      { scope: 'salary', effective_from: '2026-11', limit_poisha: 1, updated_at: 'z' },
      { scope: 'food', effective_from: '2026-13', limit_poisha: 1, updated_at: 'z' },
      { scope: 'rent', effective_from: '2026-11', limit_poisha: 0, updated_at: 'z' },
    ]);

    await expect(repository.listAll()).resolves.toEqual([
      { scope: 'food', effectiveFrom: '2026-11', limit: 500000, updatedAt: 'x' },
      { scope: 'overall', effectiveFrom: '2026-10', limit: null, updatedAt: 'y' },
    ]);
  });

  it('upserts a limit for the scope and month', async () => {
    const { db, repository } = setup();

    const saved = await repository.setLimit('food', '2026-11' as MonthKey, toPoisha(600000));

    expect(saved).toEqual({
      scope: 'food',
      effectiveFrom: '2026-11',
      limit: 600000,
      updatedAt: '2026-11-12T04:30:00.000Z',
    });
    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('ON CONFLICT (scope, effective_from)');
    expect(params).toEqual(['food', '2026-11', 600000, '2026-11-12T04:30:00.000Z']);
  });

  it('stores a removal as a null limit', async () => {
    const { db, repository } = setup();

    await repository.setLimit('overall', '2026-11' as MonthKey, null);

    expect(db.runAsync.mock.calls[0][1]).toEqual([
      'overall',
      '2026-11',
      null,
      '2026-11-12T04:30:00.000Z',
    ]);
  });
});
