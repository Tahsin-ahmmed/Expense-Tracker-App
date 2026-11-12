import { useBudgetsStore } from '@/features/budgets/useBudgetsStore';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';

import { useAuthStore } from './instance';

/**
 * Clears every user's financial data from memory whenever the signed-in
 * account changes (sign-out, or a different person signing in), so nobody
 * ever sees the previous account's data. Returns an unsubscribe function.
 */
export function clearDataOnAccountChange(): () => void {
  return useAuthStore.subscribe((state, previous) => {
    if (state.user?.id !== previous.user?.id) {
      useTransactionsStore.getState().reset();
      useBudgetsStore.getState().reset();
    }
  });
}
