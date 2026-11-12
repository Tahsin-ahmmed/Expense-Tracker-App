import { EXPENSE_CATEGORY_IDS, type ExpenseCategoryId } from './category';
import { monthOf, type MonthKey } from './date';
import { sumPoisha, toPoisha, type Poisha } from './money';
import type { Transaction } from './transaction';

/**
 * Monthly spending limits.
 *
 * A budget applies to the whole month's expenses ('overall') or to one
 * expense category. Limits are stored as history: each entry takes effect
 * from `effectiveFrom` and stays in force for later months until another
 * entry for the same scope replaces it. Changing a limit in December
 * therefore does not rewrite November's budget.
 */
export type BudgetScope = 'overall' | ExpenseCategoryId;

export const OVERALL_SCOPE = 'overall' satisfies BudgetScope;

export interface BudgetEntry {
  scope: BudgetScope;
  effectiveFrom: MonthKey;
  /** `null` removes the budget from `effectiveFrom` onward. */
  limit: Poisha | null;
  /** ISO 8601 UTC timestamp of the last change. */
  updatedAt: string;
}

/** Share of the limit at which a budget is shown as "almost used". */
export const WARNING_PERCENT = 80;

export type BudgetStatus = 'ok' | 'warning' | 'over';

export interface BudgetProgress {
  scope: BudgetScope;
  limit: Poisha;
  spent: Poisha;
  /** limit − spent; negative when over budget. */
  remaining: Poisha;
  /** Whole percent of the limit spent (can exceed 100). */
  percent: number;
  status: BudgetStatus;
}

export function isBudgetScope(value: unknown): value is BudgetScope {
  return value === OVERALL_SCOPE || EXPENSE_CATEGORY_IDS.includes(value as ExpenseCategoryId);
}

/** The limits in force for a month: for each scope, the latest entry not after it. */
export function resolveLimits(
  entries: readonly BudgetEntry[],
  month: MonthKey,
): Map<BudgetScope, Poisha> {
  const latest = new Map<BudgetScope, BudgetEntry>();
  for (const entry of entries) {
    if (entry.effectiveFrom > month) {
      continue;
    }
    const current = latest.get(entry.scope);
    if (!current || entry.effectiveFrom > current.effectiveFrom) {
      latest.set(entry.scope, entry);
    }
  }

  const limits = new Map<BudgetScope, Poisha>();
  for (const [scope, entry] of latest) {
    if (entry.limit !== null) {
      limits.set(scope, entry.limit);
    }
  }
  return limits;
}

/** Expense totals for a month: overall and per category. */
export function spendingByScope(
  transactions: readonly Transaction[],
  month: MonthKey,
): Map<BudgetScope, Poisha> {
  const amounts = new Map<BudgetScope, Poisha[]>();
  const add = (scope: BudgetScope, amount: Poisha) => {
    const list = amounts.get(scope) ?? [];
    list.push(amount);
    amounts.set(scope, list);
  };

  for (const tx of transactions) {
    if (tx.type !== 'expense' || monthOf(tx.occurredOn) !== month) {
      continue;
    }
    add(OVERALL_SCOPE, tx.amount);
    if (isBudgetScope(tx.categoryId)) {
      add(tx.categoryId, tx.amount);
    }
  }

  const totals = new Map<BudgetScope, Poisha>();
  for (const [scope, list] of amounts) {
    totals.set(scope, sumPoisha(list));
  }
  return totals;
}

/** Progress of one budget. `limit` must be positive. */
export function budgetProgress(scope: BudgetScope, limit: Poisha, spent: Poisha): BudgetProgress {
  // Integer maths: floor so 79.9% is still "ok" and 100% exactly is not "over".
  const percent = Math.floor((spent * 100) / limit);
  const status: BudgetStatus =
    spent > limit ? 'over' : percent >= WARNING_PERCENT ? 'warning' : 'ok';
  return { scope, limit, spent, remaining: toPoisha(limit - spent), percent, status };
}

export interface MonthBudgets {
  month: MonthKey;
  overall: BudgetProgress | null;
  /** Category budgets, in the standard category order. */
  categories: BudgetProgress[];
  /** Expense per category this month, including categories without a budget. */
  spent: Map<BudgetScope, Poisha>;
  /** Sum of category limits, to compare against the overall limit. */
  categoryLimitTotal: Poisha;
}

/** Everything the budget screens need for one month. */
export function buildMonthBudgets(
  entries: readonly BudgetEntry[],
  transactions: readonly Transaction[],
  month: MonthKey,
): MonthBudgets {
  const limits = resolveLimits(entries, month);
  const spent = spendingByScope(transactions, month);
  const spentFor = (scope: BudgetScope) => spent.get(scope) ?? toPoisha(0);

  const overallLimit = limits.get(OVERALL_SCOPE);
  const categories: BudgetProgress[] = [];
  const categoryLimits: Poisha[] = [];
  for (const categoryId of EXPENSE_CATEGORY_IDS) {
    const limit = limits.get(categoryId);
    if (limit !== undefined) {
      categories.push(budgetProgress(categoryId, limit, spentFor(categoryId)));
      categoryLimits.push(limit);
    }
  }

  return {
    month,
    overall: overallLimit
      ? budgetProgress(OVERALL_SCOPE, overallLimit, spentFor(OVERALL_SCOPE))
      : null,
    categories,
    spent,
    categoryLimitTotal: sumPoisha(categoryLimits),
  };
}
