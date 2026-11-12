import type { BudgetEntry } from '@/domain/budget';
import { daysInMonth, type IsoDate, type MonthKey } from '@/domain/date';
import { formatTakaCompact, toPoisha } from '@/domain/money';
import { makeTransaction } from '@/test-utils/transactions';

import { niceAxisMax } from '../components/TrendChart';
import { buildMonthReport, buildTrend, monthTotals } from '../report';

const nov = '2026-11' as MonthKey;
const today = '2026-11-12' as IsoDate;

const transactions = [
  // November
  makeTransaction({
    id: 'salary',
    type: 'income',
    categoryId: 'salary',
    amount: 5000000,
    paymentMethod: 'bank',
    occurredOn: '2026-11-01',
  }),
  makeTransaction({
    id: 'rent',
    categoryId: 'rent',
    amount: 1500000,
    paymentMethod: 'bkash',
    occurredOn: '2026-11-02',
  }),
  makeTransaction({
    id: 'lunch',
    categoryId: 'food',
    amount: 30000,
    paymentMethod: 'cash',
    occurredOn: '2026-11-05',
  }),
  makeTransaction({
    id: 'dinner',
    categoryId: 'food',
    amount: 30000,
    paymentMethod: 'bkash',
    occurredOn: '2026-11-10',
  }),
  // October
  makeTransaction({
    id: 'oct-salary',
    type: 'income',
    categoryId: 'salary',
    amount: 4000000,
    occurredOn: '2026-10-01',
  }),
  makeTransaction({
    id: 'oct-rent',
    categoryId: 'rent',
    amount: 1200000,
    occurredOn: '2026-10-02',
  }),
];

describe('monthTotals', () => {
  it('sums income, expense and net for the month only', () => {
    expect(monthTotals(transactions, nov)).toEqual({
      month: nov,
      income: 5000000,
      expense: 1560000,
      net: 3440000,
    });
  });
});

describe('buildMonthReport', () => {
  const report = buildMonthReport(transactions, [], nov, today);

  it('compares with the previous month', () => {
    expect(report.previous).toMatchObject({ month: '2026-10', income: 4000000, expense: 1200000 });
    expect(report.incomeChangePercent).toBe(25);
    expect(report.expenseChangePercent).toBe(30);
  });

  it('computes the savings rate from net and income', () => {
    // 34,400 / 50,000 = 68.8% → 69%
    expect(report.savingsRatePercent).toBe(69);
  });

  it('averages spending over days elapsed in the current month', () => {
    // ৳15,600 over 12 days = ৳1,300
    expect(report.dailyAverageExpense).toBe(130000);
  });

  it('averages over the whole month for past months', () => {
    const october = buildMonthReport(transactions, [], '2026-10' as MonthKey, today);
    // ৳12,000 over 31 days = ৳387.10 (rounded to the poisha)
    expect(october.dailyAverageExpense).toBe(Math.round(1200000 / 31));
  });

  it('finds the largest expense and counts transactions', () => {
    expect(report.largestExpense?.id).toBe('rent');
    expect(report.transactionCount).toBe(4);
  });

  it('ranks categories and payment methods by expense with shares', () => {
    expect(report.categories).toEqual([
      { key: 'rent', amount: 1500000, sharePercent: 96 },
      { key: 'food', amount: 60000, sharePercent: 4 },
    ]);
    expect(report.paymentMethods.map((m) => [m.key, m.amount])).toEqual([
      ['bkash', 1530000],
      ['cash', 30000],
    ]);
  });

  it('includes budget results for that month', () => {
    const entries: BudgetEntry[] = [
      { scope: 'food', effectiveFrom: nov, limit: toPoisha(50000), updatedAt: 'x' },
    ];
    const withBudgets = buildMonthReport(transactions, entries, nov, today);
    expect(withBudgets.budgets.categories[0]).toMatchObject({ scope: 'food', status: 'over' });
  });

  it('handles a month with nothing recorded', () => {
    const empty = buildMonthReport(transactions, [], '2026-09' as MonthKey, today);
    expect(empty).toMatchObject({
      transactionCount: 0,
      savingsRatePercent: null,
      incomeChangePercent: null,
      expenseChangePercent: null,
      largestExpense: null,
      dailyAverageExpense: 0,
      categories: [],
    });
  });
});

describe('buildTrend', () => {
  it('returns six months ending with the given month, oldest first', () => {
    const trend = buildTrend(transactions, nov);
    expect(trend.map((m) => m.month)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(trend[4]).toMatchObject({ income: 4000000, expense: 1200000 });
  });

  it('crosses year boundaries', () => {
    expect(buildTrend([], '2027-02' as MonthKey, 3).map((m) => m.month)).toEqual([
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });
});

describe('daysInMonth', () => {
  it.each([
    ['2026-11', 30],
    ['2026-12', 31],
    ['2026-02', 28],
    ['2028-02', 29],
  ])('%s has %i days', (month, days) => {
    expect(daysInMonth(month as MonthKey)).toBe(days);
  });
});

describe('formatTakaCompact', () => {
  it.each([
    [0, '৳0'],
    [95000, '৳950'],
    [2500000, '৳25K'],
    [2550000, '৳25.5K'],
    [15000000, '৳1.5L'],
    [10000000, '৳1L'],
    [1200000000, '৳1.2Cr'],
    [-2500000, '-৳25K'],
  ])('%i poisha → %s', (amount, expected) => {
    expect(formatTakaCompact(toPoisha(amount))).toBe(expected);
  });
});

describe('niceAxisMax', () => {
  it.each([
    [0, 0],
    [5000000, 5000000], // ৳50,000 → ৳50,000
    [4300000, 5000000], // ৳43,000 → ৳50,000
    [1560000, 2000000], // ৳15,600 → ৳20,000
    [2100000, 4000000], // ৳21,000 → ৳40,000
    [70000, 100000], // ৳700 → ৳1,000
  ])('%i → %i', (max, expected) => {
    expect(niceAxisMax(max)).toBe(expected);
  });
});
