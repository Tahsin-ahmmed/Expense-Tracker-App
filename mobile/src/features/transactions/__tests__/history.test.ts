import { addMonths, type MonthKey } from '@/domain/date';
import { makeTransaction } from '@/test-utils/transactions';

import { filterTransactions, groupByDay, totalsFor, type HistoryFilter } from '../history';
import { transactionSearchText } from '../searchText';

const november = '2026-11' as MonthKey;

function filter(overrides: Partial<HistoryFilter> = {}): HistoryFilter {
  return { month: november, type: 'all', query: '', ...overrides };
}

const lunch = makeTransaction({
  id: 'lunch',
  categoryId: 'food',
  amount: 125050,
  note: 'Lunch with team',
  paymentMethod: 'bkash',
  occurredOn: '2026-11-10',
});
const salary = makeTransaction({
  id: 'salary',
  type: 'income',
  categoryId: 'salary',
  amount: 5000000,
  paymentMethod: 'bank',
  occurredOn: '2026-11-01',
});
const bus = makeTransaction({
  id: 'bus',
  categoryId: 'transport',
  amount: 3000,
  occurredOn: '2026-11-10',
  createdAt: '2026-11-10T12:00:00.000Z',
});
const october = makeTransaction({ id: 'october', occurredOn: '2026-10-31' });
const all = [october, salary, lunch, bus];

describe('filterTransactions', () => {
  it('keeps only the chosen month, newest first', () => {
    expect(filterTransactions(all, filter(), transactionSearchText).map((tx) => tx.id)).toEqual([
      'bus',
      'lunch',
      'salary',
    ]);
  });

  it('filters by type', () => {
    const ids = (type: HistoryFilter['type']) =>
      filterTransactions(all, filter({ type }), transactionSearchText).map((tx) => tx.id);
    expect(ids('income')).toEqual(['salary']);
    expect(ids('expense')).toEqual(['bus', 'lunch']);
  });

  it.each([
    ['team', ['lunch']], // note
    ['FOOD', ['lunch']], // category name, case-insensitive
    ['bkash', ['lunch']], // payment method name
    ['1250', ['lunch']], // amount digits without comma
    ['1,250.50', ['lunch']], // amount as written
    ['50000', ['salary']],
    ['  transport ', ['bus']], // trimmed
    ['nothing-matches', []],
  ])('searches %j', (query, expected) => {
    expect(
      filterTransactions(all, filter({ query }), transactionSearchText).map((tx) => tx.id),
    ).toEqual(expected);
  });
});

describe('totalsFor', () => {
  it('sums income and expense separately', () => {
    expect(totalsFor([salary, lunch, bus])).toEqual({ income: 5000000, expense: 128050 });
    expect(totalsFor([])).toEqual({ income: 0, expense: 0 });
  });
});

describe('groupByDay', () => {
  it('groups consecutive days and computes each day net', () => {
    const sections = groupByDay([bus, lunch, salary]);

    expect(sections.map((s) => [s.date, s.data.map((tx) => tx.id), s.net])).toEqual([
      ['2026-11-10', ['bus', 'lunch'], -128050],
      ['2026-11-01', ['salary'], 5000000],
    ]);
  });

  it('returns no sections for no transactions', () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe('addMonths', () => {
  it('moves across year boundaries', () => {
    expect(addMonths('2026-01' as MonthKey, -1)).toBe('2025-12');
    expect(addMonths('2026-12' as MonthKey, 1)).toBe('2027-01');
    expect(addMonths(november, -13)).toBe('2025-10');
    expect(addMonths(november, 0)).toBe('2026-11');
  });
});
