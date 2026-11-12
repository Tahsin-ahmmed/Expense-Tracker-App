import { makeTransaction } from '@/test-utils/transactions';

import { currentBalance, monthStart } from '../balance';
import { CURRENCY_CODES, isCurrencyCode } from '../currency';
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

  it('offers Taka, Rupee, Dollar, Euro and Pound', () => {
    expect(CURRENCY_CODES).toEqual(['BDT', 'INR', 'USD', 'EUR', 'GBP']);
    expect(isCurrencyCode('PKR')).toBe(false);
  });

  it.each([
    ['BDT', 1000000050, '৳1,00,00,000.50'],
    ['INR', 10000000, '₹1,00,000.00'],
    ['USD', 1000000050, '$10,000,000.50'],
    ['EUR', 125050, '€1,250.50'],
    ['GBP', 100, '£1.00'],
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
    expect(formatMoneyCompact(toMinor(250000000), 'INR')).toBe('₹25L');
    expect(formatMoneyCompact(toMinor(15000000), 'USD')).toBe('$150K');
    expect(formatMoneyCompact(toMinor(250000000), 'GBP')).toBe('£2.5M');
  });

  it('parses amounts typed with a currency symbol or code', () => {
    expect(parseAmountInput('$12.50')).toBe(1250);
    expect(parseAmountInput('€ 1,000')).toBe(100000);
    expect(parseAmountInput('₹500')).toBe(50000);
    expect(parseAmountInput('Rs. 500')).toBe(50000);
    expect(parseAmountInput('gbp 20')).toBe(2000);
  });
});

describe('balance and carry-over', () => {
  const profile = { openingBalance: toMinor(2500000) }; // ৳25,000 starting balance
  const transactions = [
    makeTransaction({ id: 'oct-rent', amount: 1200000, occurredOn: '2026-10-15' }),
    makeTransaction({
      id: 'oct-salary',
      type: 'income',
      categoryId: 'salary',
      amount: 500000,
      occurredOn: '2026-10-20',
    }),
    makeTransaction({ id: 'nov-food', amount: 100000, occurredOn: '2026-11-05' }),
    makeTransaction({ id: 'nov-later', amount: 50000, occurredOn: '2026-11-20' }),
  ];

  it('adds every transaction up to today to the starting balance', () => {
    // 25,000 − 12,000 + 5,000 − 1,000 = 17,000 (20 Nov is after today)
    expect(currentBalance(transactions, profile, '2026-11-12' as IsoDate)).toBe(1700000);
    expect(currentBalance(transactions, profile, '2026-11-05' as IsoDate)).toBe(1700000);
    expect(currentBalance(transactions, profile, '2026-11-04' as IsoDate)).toBe(1800000);
  });

  it('raises the balance by exactly the opening balance (e.g. +1,000)', () => {
    const today = '2026-11-12' as IsoDate;
    const without = currentBalance(transactions, { openingBalance: toMinor(0) }, today);
    const withThousand = currentBalance(transactions, { openingBalance: toMinor(100000) }, today);
    expect(withThousand - without).toBe(100000);
  });

  it('starts from zero when no starting balance was given', () => {
    expect(
      currentBalance(transactions, { openingBalance: toMinor(0) }, '2026-11-12' as IsoDate),
    ).toBe(-800000);
  });

  it('starts the first month from the starting balance', () => {
    expect(monthStart(transactions, profile, '2026-10' as MonthKey)).toEqual({
      kind: 'opening',
      amount: 2500000,
    });
    expect(monthStart([], { openingBalance: toMinor(0) }, '2026-10' as MonthKey)).toBeNull();
  });

  it('carries each month end into the next month', () => {
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
    const owing = { openingBalance: toMinor(-50000) };
    expect(monthStart(transactions, owing, '2026-11' as MonthKey)).toMatchObject({
      amount: -50000 - 1200000 + 500000,
    });
  });

  it('updates later months automatically when an old transaction changes', () => {
    const edited = transactions.map((tx) =>
      tx.id === 'oct-rent' ? { ...tx, amount: toMinor(1000000) } : tx,
    );
    expect(monthStart(edited, profile, '2026-11' as MonthKey)).toMatchObject({ amount: 2000000 });
  });
});
