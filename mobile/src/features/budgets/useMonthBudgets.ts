import { useMemo } from 'react';

import { buildMonthBudgets, type MonthBudgets } from '@/domain/budget';
import type { MonthKey } from '@/domain/date';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useAppData } from '@/hooks/useAppData';
import type { LoadStatus } from '@/lib/loadStatus';

import { useBudgetsStore } from './useBudgetsStore';

export interface MonthBudgetsResult {
  budgets: MonthBudgets;
  /** Combined status of the user's data (transactions, budgets, profile). */
  status: LoadStatus;
  retry: () => void;
}

/** Loads the user's data (if needed) and builds a month's budget progress. */
export function useMonthBudgets(month: MonthKey): MonthBudgetsResult {
  const { status, retry } = useAppData();
  const entries = useBudgetsStore((state) => state.entries);
  const transactions = useTransactionsStore((state) => state.transactions);

  const budgets = useMemo(
    () => buildMonthBudgets(entries, transactions, month),
    [entries, transactions, month],
  );

  return { budgets, status, retry };
}
