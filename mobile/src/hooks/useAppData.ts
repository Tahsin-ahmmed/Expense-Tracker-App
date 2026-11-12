import { useEffect } from 'react';

import { useBudgetsStore } from '@/features/budgets/useBudgetsStore';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import type { LoadStatus } from '@/lib/loadStatus';

export interface AppDataStatus {
  /** 'ready' only when transactions, budgets and profile have all loaded. */
  status: LoadStatus;
  /** Retries whichever stores failed. */
  retry: () => void;
}

/** Loads the signed-in user's data (once) and reports the combined status. */
export function useAppData(): AppDataStatus {
  const transactions = useTransactionsStore((state) => state.status);
  const loadTransactions = useTransactionsStore((state) => state.load);
  const budgets = useBudgetsStore((state) => state.status);
  const loadBudgets = useBudgetsStore((state) => state.load);
  const profile = useProfileStore((state) => state.status);
  const loadProfile = useProfileStore((state) => state.load);

  useEffect(() => {
    if (transactions === 'idle') void loadTransactions();
  }, [transactions, loadTransactions]);
  useEffect(() => {
    if (budgets === 'idle') void loadBudgets();
  }, [budgets, loadBudgets]);
  useEffect(() => {
    if (profile === 'idle') void loadProfile();
  }, [profile, loadProfile]);

  const statuses = [transactions, budgets, profile];
  const status: LoadStatus = statuses.includes('error')
    ? 'error'
    : statuses.every((s) => s === 'ready')
      ? 'ready'
      : 'loading';

  const retry = () => {
    if (transactions === 'error') void loadTransactions();
    if (budgets === 'error') void loadBudgets();
    if (profile === 'error') void loadProfile();
  };

  return { status, retry };
}
