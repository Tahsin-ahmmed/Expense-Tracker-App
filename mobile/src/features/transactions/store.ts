import { create } from 'zustand';

import type { TransactionRepository } from '@/data/repositories';
import { compareNewestFirst, type NewTransaction, type Transaction } from '@/domain/transaction';
import type { LoadStatus } from '@/lib/loadStatus';

export type { LoadStatus } from '@/lib/loadStatus';

export interface TransactionsState {
  /** Newest first. */
  transactions: Transaction[];
  status: LoadStatus;
  /** Loads transactions from storage. Safe to call again to retry after an error. */
  load: () => Promise<void>;
  /** Saves a transaction and adds it to the list. Rejects if saving fails. */
  add: (input: NewTransaction) => Promise<Transaction>;
  /** Saves changes to a transaction. Rejects if saving fails; the list is then unchanged. */
  update: (id: string, input: NewTransaction) => Promise<void>;
  /** Deletes a transaction. Rejects if deleting fails; the list is then unchanged. */
  remove: (id: string) => Promise<void>;
  /** Clears all data from memory (on sign-out or account switch). */
  reset: () => void;
}

/** Creates the transactions store around a repository (injected for testing). */
export function createTransactionsStore(repository: TransactionRepository) {
  // Incremented by reset(): results of requests started before a reset are
  // discarded, so one account's data can never appear after switching accounts.
  let generation = 0;

  return create<TransactionsState>()((set, get) => ({
    transactions: [],
    status: 'idle',

    async load() {
      if (get().status === 'loading') {
        return;
      }
      const started = generation;
      set({ status: 'loading' });
      try {
        const transactions = await repository.listAll();
        if (started === generation) {
          set({ transactions, status: 'ready' });
        }
      } catch {
        // Do not log the error payload: it may contain financial data.
        if (started === generation) {
          set({ status: 'error' });
        }
      }
    },

    async add(input) {
      const started = generation;
      const saved = await repository.create(input);
      if (started === generation) {
        set((state) => ({
          transactions: [saved, ...state.transactions].sort(compareNewestFirst),
        }));
      }
      return saved;
    },

    async update(id, input) {
      const started = generation;
      await repository.update(id, input);
      if (started === generation) {
        set((state) => ({
          transactions: state.transactions
            .map((tx) => (tx.id === id ? { ...tx, ...input } : tx))
            .sort(compareNewestFirst),
        }));
      }
    },

    async remove(id) {
      const started = generation;
      await repository.remove(id);
      if (started === generation) {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      }
    },

    reset() {
      generation += 1;
      set({ transactions: [], status: 'idle' });
    },
  }));
}
