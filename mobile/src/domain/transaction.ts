import type { CategoryId } from './category';
import type { IsoDate } from './date';
import type { Poisha } from './money';

export const TRANSACTION_TYPES = ['expense', 'income'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'bank', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Maximum length of a transaction note. */
export const NOTE_MAX_LENGTH = 140;

/**
 * A single income or expense entry.
 *
 * `amount` is always positive; `type` says whether it adds to or subtracts
 * from the balance.
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: Poisha;
  categoryId: CategoryId;
  paymentMethod: PaymentMethod;
  note: string | null;
  /** Calendar day the transaction happened, in Dhaka time. */
  occurredOn: IsoDate;
  /** When the record was created, as an ISO 8601 UTC timestamp. */
  createdAt: string;
}

/** Data needed to create a transaction; the id and timestamp are assigned on save. */
export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export function isTransactionType(value: unknown): value is TransactionType {
  return TRANSACTION_TYPES.includes(value as TransactionType);
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

/**
 * Newest first: by the day it happened, then by when it was recorded.
 * Use with `Array.prototype.sort`.
 */
export function compareNewestFirst(a: Transaction, b: Transaction): number {
  if (a.occurredOn !== b.occurredOn) {
    return a.occurredOn < b.occurredOn ? 1 : -1;
  }
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? 1 : -1;
  }
  return 0;
}
