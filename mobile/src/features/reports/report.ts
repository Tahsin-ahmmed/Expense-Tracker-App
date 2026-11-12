import { buildMonthBudgets, type BudgetEntry, type MonthBudgets } from '@/domain/budget';
import type { CategoryId } from '@/domain/category';
import {
  addMonths,
  daysInMonth,
  monthOf,
  parseIsoDate,
  type IsoDate,
  type MonthKey,
} from '@/domain/date';
import { sumPoisha, toPoisha, type Poisha } from '@/domain/money';
import type { PaymentMethod, Transaction } from '@/domain/transaction';

export interface MonthTotals {
  month: MonthKey;
  income: Poisha;
  expense: Poisha;
  /** income − expense; negative when spending exceeded income. */
  net: Poisha;
}

export interface RankedAmount<K extends string> {
  key: K;
  amount: Poisha;
  /** Share of the month's expense, whole percent. */
  sharePercent: number;
}

export interface MonthReport {
  totals: MonthTotals;
  previous: MonthTotals;
  /** Whole-percent change vs the previous month; null when the previous month was 0. */
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  /** Share of income kept (net / income), whole percent; null without income. */
  savingsRatePercent: number | null;
  /** Expense per day: whole month for past months, days so far for the current one. */
  dailyAverageExpense: Poisha;
  largestExpense: Transaction | null;
  transactionCount: number;
  categories: RankedAmount<CategoryId>[];
  paymentMethods: RankedAmount<PaymentMethod>[];
  budgets: MonthBudgets;
}

function inMonth(transactions: readonly Transaction[], month: MonthKey): Transaction[] {
  return transactions.filter((tx) => monthOf(tx.occurredOn) === month);
}

/** Income, expense and net for one month. */
export function monthTotals(transactions: readonly Transaction[], month: MonthKey): MonthTotals {
  const items = inMonth(transactions, month);
  const income = sumPoisha(items.filter((tx) => tx.type === 'income').map((tx) => tx.amount));
  const expense = sumPoisha(items.filter((tx) => tx.type === 'expense').map((tx) => tx.amount));
  return { month, income, expense, net: toPoisha(income - expense) };
}

function percentChange(current: number, previous: number): number | null {
  return previous === 0 ? null : Math.round(((current - previous) * 100) / previous);
}

/** Sums expense amounts per key, largest first (ties broken by key for stable order). */
function rankExpenses<K extends string>(
  expenses: readonly Transaction[],
  keyOf: (tx: Transaction) => K,
  total: Poisha,
): RankedAmount<K>[] {
  const groups = new Map<K, Poisha[]>();
  for (const tx of expenses) {
    const key = keyOf(tx);
    groups.set(key, [...(groups.get(key) ?? []), tx.amount]);
  }
  return [...groups.entries()]
    .map(([key, amounts]) => {
      const amount = sumPoisha(amounts);
      return {
        key,
        amount,
        sharePercent: total > 0 ? Math.round((amount * 100) / total) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.key.localeCompare(b.key));
}

/**
 * Everything the Reports screen shows for one month. `today` decides how many
 * days count toward the daily average in the current month.
 */
export function buildMonthReport(
  transactions: readonly Transaction[],
  budgetEntries: readonly BudgetEntry[],
  month: MonthKey,
  today: IsoDate,
): MonthReport {
  const totals = monthTotals(transactions, month);
  const previous = monthTotals(transactions, addMonths(month, -1));
  const items = inMonth(transactions, month);
  const expenses = items.filter((tx) => tx.type === 'expense');

  const currentMonth = monthOf(today);
  const days =
    month === currentMonth
      ? parseIsoDate(today).day
      : month < currentMonth
        ? daysInMonth(month)
        : 0;

  const largestExpense = expenses.reduce<Transaction | null>(
    (largest, tx) => (largest === null || tx.amount > largest.amount ? tx : largest),
    null,
  );

  return {
    totals,
    previous,
    incomeChangePercent: percentChange(totals.income, previous.income),
    expenseChangePercent: percentChange(totals.expense, previous.expense),
    savingsRatePercent: totals.income > 0 ? Math.round((totals.net * 100) / totals.income) : null,
    dailyAverageExpense: toPoisha(days > 0 ? Math.round(totals.expense / days) : 0),
    largestExpense,
    transactionCount: items.length,
    categories: rankExpenses(expenses, (tx) => tx.categoryId, totals.expense),
    paymentMethods: rankExpenses(expenses, (tx) => tx.paymentMethod, totals.expense),
    budgets: buildMonthBudgets(budgetEntries, transactions, month),
  };
}

/** Totals for `count` months ending with `lastMonth`, oldest first. */
export function buildTrend(
  transactions: readonly Transaction[],
  lastMonth: MonthKey,
  count = 6,
): MonthTotals[] {
  return Array.from({ length: count }, (_, index) =>
    monthTotals(transactions, addMonths(lastMonth, index - count + 1)),
  );
}
