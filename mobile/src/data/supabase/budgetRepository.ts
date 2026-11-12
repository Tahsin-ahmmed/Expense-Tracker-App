import { isBudgetScope, type BudgetEntry } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import { toMinor } from '@/domain/money';

import type { BudgetRepository } from '../repositories';
import type { AppSupabaseClient } from './client';

const COLUMNS = 'scope, effective_from, limit_poisha, updated_at';

/** The database stores months as the first day ("2026-11-01"); the app uses "2026-11". */
export function monthToDate(month: MonthKey): string {
  return `${month}-01`;
}

function dateToMonth(date: string): MonthKey | null {
  return /^\d{4}-(0[1-9]|1[0-2])-01$/.test(date) ? (date.slice(0, 7) as MonthKey) : null;
}

interface BudgetRow {
  scope: string;
  effective_from: string;
  limit_poisha: number | null;
  updated_at: string;
}

function fromRow(row: BudgetRow): BudgetEntry | null {
  const month = dateToMonth(row.effective_from);
  if (
    !isBudgetScope(row.scope) ||
    month === null ||
    (row.limit_poisha !== null &&
      (!Number.isSafeInteger(row.limit_poisha) || row.limit_poisha <= 0))
  ) {
    return null;
  }
  return {
    scope: row.scope,
    effectiveFrom: month,
    limit: row.limit_poisha === null ? null : toMinor(row.limit_poisha),
    updatedAt: row.updated_at,
  };
}

/** Budget history stored in Supabase; RLS limits it to the signed-in user. */
export function createSupabaseBudgetRepository(
  getClient: () => AppSupabaseClient,
  getUserId: () => Promise<string>,
): BudgetRepository {
  return {
    async listAll() {
      const { data, error } = await getClient()
        .from('budgets')
        .select(COLUMNS)
        .order('scope')
        .order('effective_from');
      if (error) {
        throw error;
      }
      return data.map(fromRow).filter((entry): entry is BudgetEntry => entry !== null);
    },

    async setLimit(scope, effectiveFrom, limit) {
      // user_id is part of the conflict key, so it is sent explicitly; RLS
      // still rejects any value other than the signed-in user's id.
      const { data, error } = await getClient()
        .from('budgets')
        .upsert(
          {
            user_id: await getUserId(),
            scope,
            effective_from: monthToDate(effectiveFrom),
            limit_poisha: limit,
          },
          { onConflict: 'user_id,scope,effective_from' },
        )
        .select(COLUMNS)
        .single();
      if (error) {
        throw error;
      }
      const saved = fromRow(data);
      if (!saved) {
        throw new Error('Saved budget did not match the expected format');
      }
      return saved;
    },
  };
}
