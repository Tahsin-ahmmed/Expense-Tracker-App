import {
  budgetProgress,
  buildMonthBudgets,
  isBudgetScope,
  resolveLimits,
  spendingByScope,
  type BudgetEntry,
} from '../budget';
import type { MonthKey } from '../date';
import { toPoisha } from '../money';
import { makeTransaction } from '@/test-utils/transactions';

const nov = '2026-11' as MonthKey;

function entry(
  scope: BudgetEntry['scope'],
  effectiveFrom: string,
  limit: number | null,
): BudgetEntry {
  return {
    scope,
    effectiveFrom: effectiveFrom as MonthKey,
    limit: limit === null ? null : toPoisha(limit),
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('isBudgetScope', () => {
  it('accepts overall and expense categories only', () => {
    expect(isBudgetScope('overall')).toBe(true);
    expect(isBudgetScope('food')).toBe(true);
    expect(isBudgetScope('salary')).toBe(false);
    expect(isBudgetScope('nope')).toBe(false);
  });
});

describe('resolveLimits', () => {
  const history = [
    entry('food', '2026-09', 500000),
    entry('food', '2026-11', 600000),
    entry('rent', '2026-08', 2000000),
    entry('rent', '2026-10', null), // removed from October
    entry('overall', '2026-12', 5000000), // starts in the future
  ];

  it('uses the latest entry not after the month', () => {
    const limits = resolveLimits(history, nov);
    expect(limits.get('food')).toBe(600000);
    expect(limits.has('rent')).toBe(false);
    expect(limits.has('overall')).toBe(false);
  });

  it('keeps older months on their old limits', () => {
    const october = resolveLimits(history, '2026-10' as MonthKey);
    expect(october.get('food')).toBe(500000);

    const september = resolveLimits(history, '2026-09' as MonthKey);
    expect(september.get('rent')).toBe(2000000);

    expect(resolveLimits(history, '2026-07' as MonthKey).size).toBe(0);
  });

  it('applies a limit to later months until replaced', () => {
    expect(resolveLimits(history, '2027-03' as MonthKey).get('overall')).toBe(5000000);
  });
});

describe('spendingByScope', () => {
  it('sums expenses for the month overall and per category, ignoring income', () => {
    const spent = spendingByScope(
      [
        makeTransaction({ categoryId: 'food', amount: 10000 }),
        makeTransaction({ categoryId: 'food', amount: 5050 }),
        makeTransaction({ categoryId: 'rent', amount: 100000 }),
        makeTransaction({ type: 'income', categoryId: 'salary', amount: 999999 }),
        makeTransaction({ categoryId: 'food', amount: 77777, occurredOn: '2026-10-31' }),
      ],
      nov,
    );

    expect(spent.get('overall')).toBe(115050);
    expect(spent.get('food')).toBe(15050);
    expect(spent.get('rent')).toBe(100000);
    expect(spent.has('transport')).toBe(false);
  });
});

describe('budgetProgress', () => {
  const limit = toPoisha(100000);

  it.each([
    [0, 0, 'ok'],
    [79999, 79, 'ok'],
    [80000, 80, 'warning'],
    [100000, 100, 'warning'],
    [100001, 100, 'over'],
    [150000, 150, 'over'],
  ])('spent %i → %i%% %s', (spent, percent, status) => {
    const progress = budgetProgress('food', limit, toPoisha(spent));
    expect(progress.percent).toBe(percent);
    expect(progress.status).toBe(status);
    expect(progress.remaining).toBe(100000 - spent);
  });
});

describe('buildMonthBudgets', () => {
  it('builds overall and category progress in category order', () => {
    const budgets = buildMonthBudgets(
      [
        entry('overall', '2026-11', 300000),
        entry('rent', '2026-11', 200000),
        entry('food', '2026-11', 50000),
      ],
      [makeTransaction({ categoryId: 'food', amount: 60000 })],
      nov,
    );

    expect(budgets.overall).toMatchObject({ limit: 300000, spent: 60000, status: 'ok' });
    expect(budgets.categories.map((c) => [c.scope, c.status])).toEqual([
      ['food', 'over'],
      ['rent', 'ok'],
    ]);
    expect(budgets.categoryLimitTotal).toBe(250000);
  });

  it('has no overall progress when no overall limit is set', () => {
    expect(buildMonthBudgets([], [], nov)).toMatchObject({
      overall: null,
      categories: [],
      categoryLimitTotal: 0,
    });
  });
});
