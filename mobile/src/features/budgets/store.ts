import { create } from 'zustand';

import type { BudgetRepository } from '@/data/repositories';
import type { BudgetEntry, BudgetScope } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import type { Poisha } from '@/domain/money';
import type { LoadStatus } from '@/lib/loadStatus';

export interface BudgetsState {
  entries: BudgetEntry[];
  status: LoadStatus;
  load: () => Promise<void>;
  /** Sets a limit from `month` onward; `null` removes it. Rejects if saving fails. */
  setLimit: (scope: BudgetScope, month: MonthKey, limit: Poisha | null) => Promise<void>;
  /** Clears all data from memory (on sign-out or account switch). */
  reset: () => void;
}

/** Creates the budgets store around a repository (injected for testing). */
export function createBudgetsStore(repository: BudgetRepository) {
  // See the transactions store: discards results from before a reset.
  let generation = 0;

  return create<BudgetsState>()((set, get) => ({
    entries: [],
    status: 'idle',

    async load() {
      if (get().status === 'loading') {
        return;
      }
      const started = generation;
      set({ status: 'loading' });
      try {
        const entries = await repository.listAll();
        if (started === generation) {
          set({ entries, status: 'ready' });
        }
      } catch {
        // Do not log the error payload: it may contain financial data.
        if (started === generation) {
          set({ status: 'error' });
        }
      }
    },

    async setLimit(scope, month, limit) {
      const started = generation;
      const saved = await repository.setLimit(scope, month, limit);
      if (started === generation) {
        set((state) => ({
          entries: [
            ...state.entries.filter(
              (entry) => !(entry.scope === scope && entry.effectiveFrom === month),
            ),
            saved,
          ],
        }));
      }
    },

    reset() {
      generation += 1;
      set({ entries: [], status: 'idle' });
    },
  }));
}
