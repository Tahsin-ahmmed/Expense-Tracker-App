import type { CategoryId } from '@/domain/category';
import { monthOf, type IsoDate, type MonthKey } from '@/domain/date';
import { sumPoisha, toPoisha, type Poisha } from '@/domain/money';
import { compareNewestFirst, type Transaction } from '@/domain/transaction';

export const TOP_CATEGORY_LIMIT = 5;
export const RECENT_TRANSACTION_LIMIT = 5;

export interface CategorySpending {
  categoryId: CategoryId;
  amount: Poisha;
  /** Share of this month's expenses, 0–100, rounded to a whole percent. */
  sharePercent: number;
}

export interface DashboardSummary {
  month: MonthKey;
  income: Poisha;
  expense: Poisha;
  /** income − expense for the month. Can be negative. */
  balance: Poisha;
  /** Largest expense categories this month, biggest first. */
  topCategories: CategorySpending[];
  /** Most recent transactions across all months. */
  recent: Transaction[];
}

/** Builds the dashboard figures for the month containing `today` (Dhaka). */
export function buildDashboardSummary(
  transactions: readonly Transaction[],
  today: IsoDate,
): DashboardSummary {
  const month = monthOf(today);
  const thisMonth = transactions.filter((tx) => monthOf(tx.occurredOn) === month);

  const incomes = thisMonth.filter((tx) => tx.type === 'income').map((tx) => tx.amount);
  const expenses = thisMonth.filter((tx) => tx.type === 'expense');

  const income = sumPoisha(incomes);
  const expense = sumPoisha(expenses.map((tx) => tx.amount));

  const byCategory = new Map<CategoryId, Poisha[]>();
  for (const tx of expenses) {
    const list = byCategory.get(tx.categoryId) ?? [];
    list.push(tx.amount);
    byCategory.set(tx.categoryId, list);
  }

  const topCategories = [...byCategory.entries()]
    .map(([categoryId, amounts]) => {
      const amount = sumPoisha(amounts);
      return {
        categoryId,
        amount,
        sharePercent: expense > 0 ? Math.round((amount * 100) / expense) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.categoryId.localeCompare(b.categoryId))
    .slice(0, TOP_CATEGORY_LIMIT);

  const recent = [...transactions].sort(compareNewestFirst).slice(0, RECENT_TRANSACTION_LIMIT);

  return {
    month,
    income,
    expense,
    balance: toPoisha(income - expense),
    topCategories,
    recent,
  };
}
