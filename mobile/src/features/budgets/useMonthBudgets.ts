import { useEffect, useMemo } from 'react';

import { buildMonthBudgets, type MonthBudgets } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import type { LoadStatus } from '@/features/transactions/store';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';

import { useBudgetsStore } from './useBudgetsStore';

export interface MonthBudgetsResult {
  budgets: MonthBudgets;
  /** Combined status of budgets and transactions. */
  status: LoadStatus;
  retry: () => void;
}

/** Loads budgets and transactions (if needed) and builds a month's budget progress. */
export function useMonthBudgets(month: MonthKey): MonthBudgetsResult {
  const entries = useBudgetsStore((state) => state.entries);
  const budgetStatus = useBudgetsStore((state) => state.status);
  const loadBudgets = useBudgetsStore((state) => state.load);
  const transactions = useTransactionsStore((state) => state.transactions);
  const transactionStatus = useTransactionsStore((state) => state.status);
  const loadTransactions = useTransactionsStore((state) => state.load);

  useEffect(() => {
    if (budgetStatus === 'idle') {
      void loadBudgets();
    }
  }, [budgetStatus, loadBudgets]);

  useEffect(() => {
    if (transactionStatus === 'idle') {
      void loadTransactions();
    }
  }, [transactionStatus, loadTransactions]);

  const budgets = useMemo(
    () => buildMonthBudgets(entries, transactions, month),
    [entries, transactions, month],
  );

  const status: LoadStatus =
    budgetStatus === 'error' || transactionStatus === 'error'
      ? 'error'
      : budgetStatus === 'ready' && transactionStatus === 'ready'
        ? 'ready'
        : 'loading';

  const retry = () => {
    if (budgetStatus === 'error') {
      void loadBudgets();
    }
    if (transactionStatus === 'error') {
      void loadTransactions();
    }
  };

  return { budgets, status, retry };
}
