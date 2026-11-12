import { budgetRepository } from '@/data';

import { createBudgetsStore } from './store';

/** App-wide budgets store backed by local storage. */
export const useBudgetsStore = createBudgetsStore(budgetRepository);
