import { makeTransaction } from '@/test-utils/transactions';

import { currentBalance, monthStart } from '../balance';
import { CURRENCY_CODES } from '../currency';
import type { IsoDate, MonthKey } from '../date';
import {
  formatMoney,
  formatMoneyCompact,
  getActiveCurrency,
  parseAmountInput,
  setActiveCurrency,
  toMinor,
} from '../money';

describe('currency formatting', () => {
  afterEach(() => setActiveCurrency('BDT'));

  it.each([
    ['BDT', 1000000050, '৳1,00,00,000.50'],
    ['INR', 10000000, '₹1,00,000.00'],
    ['USD', 1000000050, '$10,000,000.50'],
    ['EUR', 125050, '€1,250.50'],
    ['PKR', 50000, 'Rs 500.00'],
    ['AED', 9950, 'AED 99.50'],
    ['SGD', 100, 'S$1.00'],
  ] as const)('%s %i → %s', (currency, amount, expected) => {
    expect(formatMoney(toMinor(amount), { currency })).toBe(expected);
  });

  it('uses the active currency by default', () => {
    setActiveCurrency('USD');
    expect(getActiveCurrency()).toBe('USD');
    expect(formatMoney(toMinor(-125050))).toBe('-$1,250.50');
  });

  it('compacts with lakh/crore or thousand/million by currency', () => {
    expect(formatMoneyCompact(toMinor(15000000), 'BDT')).toBe('৳1.5L');
    expect(formatMoneyCompact(toMinor(15000000), 'USD')).toBe('$150K');
    expect(formatMoneyCompact(toMinor(250000000), 'USD')).toBe('$2.5M');
    expect(formatMoneyCompact(toMinor(250000000), 'PKR')).toBe('Rs 25L');
  });

  it('parses amounts typed with any supported symbol or code', () => {
    expect(parseAmountInput('$12.50')).toBe(1250);
    expect(parseAmountInput('€ 1,000')).toBe(100000);
    expect(parseAmountInput('Rs. 500')).toBe(50000);
    expect(parseAmountInput('AED 99.5')).toBe(9950);
    expect(parseAmountInput('usd 20')).toBe(2000);
  });

  it('lists exactly the currencies the database accepts', () => {
    expect(CURRENCY_CODES).toHaveLength(15);
  });
});

describe('balance and carry-over', () => {
  const profile = {
    openingBalance: toMinor(2500000), // ৳25,000 on 10 Oct
    openingBalanceDate: '2026-10-10' as IsoDate,
  };
  const transactions = [
    makeTransaction({ id: 'old', amount: 999900, occurredOn: '2026-10-01' }), // before opening: history only
    makeTransaction({ id: 'oct-rent', amount: 1200000, occurredOn: '2026-10-15' }),
    makeTransaction({
      id: 'oct-salary',
      type: 'income',
      categoryId: 'salary',
      amount: 500000,
      occurredOn: '2026-10-20',
    }),
    makeTransaction({ id: 'nov-food', amount: 100000, occurredOn: '2026-11-05' }),
    makeTransaction({ id: 'nov-future', amount: 50000, occurredOn: '2026-11-20' }),
  ];

  it('is unknown until an opening balance is set', () => {
    const none = { openingBalance: toMinor(0), openingBalanceDate: null };
    expect(currentBalance(transactions, none, '2026-11-12' as IsoDate)).toBeNull();
    expect(monthStart(transactions, none, '2026-11' as MonthKey)).toBeNull();
  });

  it('counts only transactions from the opening date up to today', () => {
    // 25,000 − 12,000 + 5,000 − 1,000 = 17,000 (the 1 Oct entry and the 20 Nov entry are excluded)
    expect(currentBalance(transactions, profile, '2026-11-12' as IsoDate)).toBe(1700000);
  });

  it('includes transactions dated today', () => {
    expect(currentBalance(transactions, profile, '2026-11-05' as IsoDate)).toBe(1700000);
    expect(currentBalance(transactions, profile, '2026-11-04' as IsoDate)).toBe(1800000);
  });

  it('starts the opening month from the opening balance', () => {
    expect(monthStart(transactions, profile, '2026-10' as MonthKey)).toEqual({
      kind: 'opening',
      amount: 2500000,
      date: '2026-10-10',
    });
  });

  it('carries the previous month end into the next month', () => {
    // End of October: 25,000 − 12,000 + 5,000 = 18,000
    expect(monthStart(transactions, profile, '2026-11' as MonthKey)).toEqual({
      kind: 'carryOver',
      amount: 1800000,
      fromMonth: '2026-10',
    });
    // End of November: 18,000 − 1,000 − 500 = 16,500
    expect(monthStart(transactions, profile, '2026-12' as MonthKey)).toMatchObject({
      amount: 1650000,
      fromMonth: '2026-11',
    });
  });

  it('can carry a negative balance', () => {
    const broke = { openingBalance: toMinor(-50000), openingBalanceDate: '2026-10-10' as IsoDate };
    expect(monthStart([], broke, '2026-11' as MonthKey)).toMatchObject({ amount: -50000 });
  });

  it('has no start for months before the opening balance', () => {
    expect(monthStart(transactions, profile, '2026-09' as MonthKey)).toBeNull();
  });

  it('updates later months automatically when an old transaction changes', () => {
    const edited = transactions.map((tx) =>
      tx.id === 'oct-rent' ? { ...tx, amount: toMinor(1000000) } : tx,
    );
    expect(monthStart(edited, profile, '2026-11' as MonthKey)).toMatchObject({ amount: 2000000 });
  });
});
