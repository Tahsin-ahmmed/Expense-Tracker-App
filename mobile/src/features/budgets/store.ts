import { create } from 'zustand';

import type { BudgetRepository } from '@/data';
import type { BudgetEntry, BudgetScope } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import type { Poisha } from '@/domain/money';
import type { LoadStatus } from '@/features/transactions/store';

export interface BudgetsState {
  entries: BudgetEntry[];
  status: LoadStatus;
  load: () => Promise<void>;
  /** Sets a limit from `month` onward; `null` removes it. Rejects if saving fails. */
  setLimit: (scope: BudgetScope, month: MonthKey, limit: Poisha | null) => Promise<void>;
}

/** Creates the budgets store around a repository (injected for testing). */
export function createBudgetsStore(repository: BudgetRepository) {
  return create<BudgetsState>()((set, get) => ({
    entries: [],
    status: 'idle',

    async load() {
      if (get().status === 'loading') {
        return;
      }
      set({ status: 'loading' });
      try {
        const entries = await repository.listAll();
        set({ entries, status: 'ready' });
      } catch {
        // Do not log the error payload: it may contain financial data.
        set({ status: 'error' });
      }
    },

    async setLimit(scope, month, limit) {
      const saved = await repository.setLimit(scope, month, limit);
      set((state) => ({
        entries: [
          ...state.entries.filter(
            (entry) => !(entry.scope === scope && entry.effectiveFrom === month),
          ),
          saved,
        ],
      }));
    },
  }));
}
