import { DEFAULT_CURRENCY } from '@/domain/currency';
import { useBudgetsStore } from '@/features/budgets/useBudgetsStore';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { applyDisplayCurrency } from '@/lib/displayCurrency';

import { useAuthStore } from './instance';

/**
 * Keeps per-account state in step with the signed-in account:
 * - clears every user's financial data and profile from memory whenever the
 *   account changes (sign-out, or a different person signing in);
 * - shows amounts in the signed-in user's currency.
 * Returns a function that stops both subscriptions.
 */
export function clearDataOnAccountChange(): () => void {
  const stopAuth = useAuthStore.subscribe((state, previous) => {
    if (state.user?.id !== previous.user?.id) {
      useTransactionsStore.getState().reset();
      useBudgetsStore.getState().reset();
      useProfileStore.getState().reset();
      applyDisplayCurrency(DEFAULT_CURRENCY);
    }
  });

  const stopCurrency = useProfileStore.subscribe((state, previous) => {
    if (state.profile.currency !== previous.profile.currency) {
      applyDisplayCurrency(state.profile.currency);
    }
  });

  return () => {
    stopAuth();
    stopCurrency();
  };
}
