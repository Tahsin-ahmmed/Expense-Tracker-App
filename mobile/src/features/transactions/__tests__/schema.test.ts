import type { IsoDate } from '@/domain/date';

import { createTransactionFormSchema, type TransactionFormValues } from '../schema';

const today = '2026-11-12' as IsoDate;
const schema = createTransactionFormSchema(today);

function values(overrides: Partial<TransactionFormValues> = {}): TransactionFormValues {
  return {
    type: 'expense',
    amount: '1,250.50',
    categoryId: 'food',
    paymentMethod: 'bkash',
    occurredOn: '2026-11-12',
    note: '  Lunch  ',
    ...overrides,
  };
}

function errorsFor(input: TransactionFormValues): Record<string, string> {
  const result = schema.safeParse(input);
  if (result.success) {
    return {};
  }
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe('transaction form schema', () => {
  it('converts valid input to a NewTransaction in poisha with a trimmed note', () => {
    expect(schema.parse(values())).toEqual({
      type: 'expense',
      amount: 125050,
      categoryId: 'food',
      paymentMethod: 'bkash',
      occurredOn: '2026-11-12',
      note: 'Lunch',
    });
  });

  it('stores an empty note as null', () => {
    expect(schema.parse(values({ note: '   ' })).note).toBeNull();
  });

  it.each([
    ['', 'Enter an amount.'],
    ['abc', 'Enter a valid amount, e.g. 250 or 1,250.50.'],
    ['-5', 'Enter a valid amount, e.g. 250 or 1,250.50.'],
    ['12.345', 'Enter a valid amount, e.g. 250 or 1,250.50.'],
    ['0', 'Amount must be more than ৳0.'],
    ['0.00', 'Amount must be more than ৳0.'],
  ])('rejects amount %j', (amount, message) => {
    expect(errorsFor(values({ amount })).amount).toBe(message);
  });

  it('requires a category', () => {
    expect(errorsFor(values({ categoryId: '' })).categoryId).toBe('Choose a category.');
  });

  it('rejects a category that belongs to the other type', () => {
    expect(errorsFor(values({ type: 'income', categoryId: 'food' })).categoryId).toBeDefined();
    expect(errorsFor(values({ type: 'income', categoryId: 'salary' }))).toEqual({});
  });

  it('rejects future and invalid dates', () => {
    expect(errorsFor(values({ occurredOn: '2026-11-13' })).occurredOn).toBe(
      'Date cannot be in the future.',
    );
    expect(errorsFor(values({ occurredOn: '2026-02-30' })).occurredOn).toBe('Choose a valid date.');
    expect(errorsFor(values({ occurredOn: '2020-01-01' }))).toEqual({});
  });

  it('rejects notes over 140 characters', () => {
    expect(errorsFor(values({ note: 'x'.repeat(141) })).note).toBeDefined();
    expect(errorsFor(values({ note: 'x'.repeat(140) }))).toEqual({});
  });
});
