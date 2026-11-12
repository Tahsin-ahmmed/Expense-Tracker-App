import type { IsoDate } from '@/domain/date';
import { makeTransaction } from '@/test-utils/transactions';

import { buildDashboardSummary } from '../summary';

const today = '2026-11-12' as IsoDate;

describe('buildDashboardSummary', () => {
  it('returns zeros and empty lists with no transactions', () => {
    const summary = buildDashboardSummary([], today);

    expect(summary).toEqual({
      month: '2026-11',
      income: 0,
      expense: 0,
      balance: 0,
      topCategories: [],
      recent: [],
    });
  });

  it('totals only the current month', () => {
    const summary = buildDashboardSummary(
      [
        makeTransaction({ type: 'income', categoryId: 'salary', amount: 5000000 }),
        makeTransaction({ amount: 125050 }),
        makeTransaction({ amount: 99999, occurredOn: '2026-10-31' }), // last month
        makeTransaction({
          type: 'income',
          categoryId: 'gift',
          amount: 1,
          occurredOn: '2026-12-01',
        }),
      ],
      today,
    );

    expect(summary.income).toBe(5000000);
    expect(summary.expense).toBe(125050);
    expect(summary.balance).toBe(5000000 - 125050);
  });

  it('allows a negative balance', () => {
    const summary = buildDashboardSummary([makeTransaction({ amount: 50000 })], today);
    expect(summary.balance).toBe(-50000);
  });

  it('ranks expense categories by amount and limits to five', () => {
    const summary = buildDashboardSummary(
      [
        makeTransaction({ categoryId: 'food', amount: 30000 }),
        makeTransaction({ categoryId: 'food', amount: 20000 }),
        makeTransaction({ categoryId: 'rent', amount: 100000 }),
        makeTransaction({ categoryId: 'transport', amount: 10000 }),
        makeTransaction({ categoryId: 'bills', amount: 9000 }),
        makeTransaction({ categoryId: 'health', amount: 8000 }),
        makeTransaction({ categoryId: 'gift', type: 'income', amount: 999999 }),
        makeTransaction({ categoryId: 'shopping', amount: 7000 }),
      ],
      today,
    );

    expect(summary.topCategories.map((c) => c.categoryId)).toEqual([
      'rent',
      'food',
      'transport',
      'bills',
      'health',
    ]);
    expect(summary.topCategories[1].amount).toBe(50000);
  });

  it('computes whole-percent shares of monthly expense', () => {
    const summary = buildDashboardSummary(
      [
        makeTransaction({ categoryId: 'rent', amount: 20000 }),
        makeTransaction({ categoryId: 'food', amount: 10000 }),
      ],
      today,
    );

    expect(summary.topCategories.map((c) => c.sharePercent)).toEqual([67, 33]);
  });

  it('lists the five most recent transactions, newest first', () => {
    const transactions = [
      makeTransaction({ id: 'old', occurredOn: '2026-09-01' }),
      makeTransaction({ id: 'a', occurredOn: '2026-11-10', createdAt: '2026-11-10T01:00:00Z' }),
      makeTransaction({ id: 'b', occurredOn: '2026-11-10', createdAt: '2026-11-10T09:00:00Z' }),
      makeTransaction({ id: 'c', occurredOn: '2026-11-12' }),
      makeTransaction({ id: 'd', occurredOn: '2026-11-11' }),
      makeTransaction({ id: 'e', occurredOn: '2026-11-01' }),
    ];

    const summary = buildDashboardSummary(transactions, today);

    expect(summary.recent.map((tx) => tx.id)).toEqual(['c', 'd', 'b', 'a', 'e']);
  });
});
