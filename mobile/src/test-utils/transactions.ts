import type { IsoDate } from '@/domain/date';
import { toPoisha } from '@/domain/money';
import type { Transaction } from '@/domain/transaction';

let counter = 0;

/** Builds a valid transaction for tests. Amount is given in poisha. */
export function makeTransaction(
  overrides: Partial<Omit<Transaction, 'amount' | 'occurredOn'>> & {
    amount?: number;
    occurredOn?: string;
  } = {},
): Transaction {
  counter += 1;
  const { amount = 10000, occurredOn = '2026-11-10', ...rest } = overrides;
  return {
    id: `tx-${counter}`,
    type: 'expense',
    categoryId: 'food',
    paymentMethod: 'cash',
    note: null,
    createdAt: `2026-11-10T08:00:${String(counter % 60).padStart(2, '0')}.000Z`,
    ...rest,
    amount: toPoisha(amount),
    occurredOn: occurredOn as IsoDate,
  };
}
