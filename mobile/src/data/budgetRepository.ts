import type { SQLiteDatabase } from 'expo-sqlite';

import { isBudgetScope, type BudgetEntry, type BudgetScope } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import { toPoisha, type Poisha } from '@/domain/money';

/** Storage for budget history. Replaced by a Supabase implementation in M6. */
export interface BudgetRepository {
  listAll(): Promise<BudgetEntry[]>;
  /**
   * Sets (or with `null`, removes) a scope's limit from `effectiveFrom` onward.
   * Replaces any entry for the same scope and month.
   */
  setLimit(scope: BudgetScope, effectiveFrom: MonthKey, limit: Poisha | null): Promise<BudgetEntry>;
}

interface BudgetRow {
  scope: string;
  effective_from: string;
  limit_poisha: number | null;
  updated_at: string;
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function fromRow(row: BudgetRow): BudgetEntry | null {
  if (
    !isBudgetScope(row.scope) ||
    !MONTH_PATTERN.test(row.effective_from) ||
    (row.limit_poisha !== null &&
      (!Number.isSafeInteger(row.limit_poisha) || row.limit_poisha <= 0))
  ) {
    return null;
  }
  return {
    scope: row.scope,
    effectiveFrom: row.effective_from as MonthKey,
    limit: row.limit_poisha === null ? null : toPoisha(row.limit_poisha),
    updatedAt: row.updated_at,
  };
}

export interface SqliteBudgetRepositoryDeps {
  getDatabase: () => Promise<SQLiteDatabase>;
  now: () => Date;
}

export function createSqliteBudgetRepository({
  getDatabase,
  now,
}: SqliteBudgetRepositoryDeps): BudgetRepository {
  return {
    async listAll() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<BudgetRow>(
        'SELECT * FROM budgets ORDER BY scope, effective_from',
      );
      return rows.map(fromRow).filter((entry): entry is BudgetEntry => entry !== null);
    },

    async setLimit(scope, effectiveFrom, limit) {
      const entry: BudgetEntry = { scope, effectiveFrom, limit, updatedAt: now().toISOString() };
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO budgets (scope, effective_from, limit_poisha, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (scope, effective_from)
         DO UPDATE SET limit_poisha = excluded.limit_poisha, updated_at = excluded.updated_at`,
        [entry.scope, entry.effectiveFrom, entry.limit, entry.updatedAt],
      );
      return entry;
    },
  };
}
