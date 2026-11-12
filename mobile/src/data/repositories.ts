import type { BudgetEntry, BudgetScope } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import type { Poisha } from '@/domain/money';
import type { NewTransaction, Transaction } from '@/domain/transaction';

/**
 * Storage contracts used by features. Features depend only on these
 * interfaces, never on Supabase directly, so storage can change without
 * touching screens or business logic.
 */

export interface TransactionRepository {
  /** All of the signed-in user's transactions, newest first. */
  listAll(): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<Transaction>;
  /** Replaces the editable fields of an existing transaction. Throws `NotFoundError` if missing. */
  update(id: string, input: NewTransaction): Promise<void>;
  /** Permanently deletes a transaction. Throws `NotFoundError` if missing. */
  remove(id: string): Promise<void>;
}

export interface BudgetRepository {
  listAll(): Promise<BudgetEntry[]>;
  /**
   * Sets (or with `null`, removes) a scope's limit from `effectiveFrom` onward.
   * Replaces any entry for the same scope and month.
   */
  setLimit(scope: BudgetScope, effectiveFrom: MonthKey, limit: Poisha | null): Promise<BudgetEntry>;
}

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`Record not found: ${id}`);
    this.name = 'NotFoundError';
  }
}
