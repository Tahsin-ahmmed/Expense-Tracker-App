import { create } from 'zustand';

import type { TransactionRepository } from '@/data';
import { compareNewestFirst, type NewTransaction, type Transaction } from '@/domain/transaction';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

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
}

/** Creates the transactions store around a repository (injected for testing). */
export function createTransactionsStore(repository: TransactionRepository) {
  return create<TransactionsState>()((set, get) => ({
    transactions: [],
    status: 'idle',

    async load() {
      if (get().status === 'loading') {
        return;
      }
      set({ status: 'loading' });
      try {
        const transactions = await repository.listAll();
        set({ transactions, status: 'ready' });
      } catch {
        // Do not log the error payload: it may contain financial data.
        set({ status: 'error' });
      }
    },

    async add(input) {
      const saved = await repository.create(input);
      set((state) => ({
        transactions: [saved, ...state.transactions].sort(compareNewestFirst),
      }));
      return saved;
    },

    async update(id, input) {
      await repository.update(id, input);
      set((state) => ({
        transactions: state.transactions
          .map((tx) => (tx.id === id ? { ...tx, ...input } : tx))
          .sort(compareNewestFirst),
      }));
    },

    async remove(id) {
      await repository.remove(id);
      set((state) => ({
        transactions: state.transactions.filter((tx) => tx.id !== id),
      }));
    },
  }));
}
