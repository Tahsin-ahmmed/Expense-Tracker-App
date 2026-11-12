import { router } from 'expo-router';

import type { BudgetScope } from '@/domain/budget';

/** Opens the set/edit budget modal for a scope ('overall' or an expense category). */
export function openEditBudget(scope: BudgetScope) {
  router.push({ pathname: '/edit-budget/[scope]', params: { scope } });
}

/** Switches to the Budgets tab. */
export function openBudgetsTab() {
  router.navigate('/budgets');
}
