import type { BudgetEntry, BudgetScope } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import type { MinorAmount } from '@/domain/money';
import type { Profile, ProfileUpdate } from '@/domain/profile';
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
  setLimit(
    scope: BudgetScope,
    effectiveFrom: MonthKey,
    limit: MinorAmount | null,
  ): Promise<BudgetEntry>;
}

export interface ProfileRepository {
  /** The user's profile, or defaults if they have never saved one. */
  get(): Promise<Profile>;
  /** Saves the given fields (creating the row if needed) and returns the full profile. */
  update(update: ProfileUpdate): Promise<Profile>;
  /** Permanently deletes the signed-in user's account and all their data. */
  deleteAccount(): Promise<void>;
}

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`Record not found: ${id}`);
    this.name = 'NotFoundError';
  }
}
