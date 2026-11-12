import { View } from 'react-native';

import { SectionHeader } from '@/components/ui';
import type { MonthStart } from '@/domain/balance';
import type { MonthBudgets } from '@/domain/budget';
import type { IsoDate } from '@/domain/date';
import type { MinorAmount } from '@/domain/money';
import type { Transaction, TransactionType } from '@/domain/transaction';
import { t } from '@/i18n';

import type { DashboardSummary } from '../summary';
import { BalanceCard } from './BalanceCard';
import { BudgetOverview } from './BudgetOverview';
import { CategoryBreakdown } from './CategoryBreakdown';
import { QuickActions } from './QuickActions';
import { RecentTransactions } from './RecentTransactions';

export interface DashboardViewProps {
  summary: DashboardSummary;
  budgets: MonthBudgets;
  /** Starting balance plus everything recorded up to today. */
  currentBalance: MinorAmount;
  monthStart: MonthStart | null;
  today: IsoDate;
  onAdd: (type: TransactionType) => void;
  onPressTransaction?: (transaction: Transaction) => void;
  onSetBudget?: () => void;
  onOpenBudgets?: () => void;
}

const noop = () => {};

/** The dashboard's sections, rendered from a prepared summary (no data access). */
export function DashboardView({
  summary,
  budgets,
  currentBalance,
  monthStart,
  today,
  onAdd,
  onPressTransaction,
  onSetBudget = noop,
  onOpenBudgets = noop,
}: DashboardViewProps) {
  return (
    <View>
      <BalanceCard
        currentBalance={currentBalance}
        month={summary.month}
        monthStart={monthStart}
        income={summary.income}
        expense={summary.expense}
      />

      <QuickActions onAdd={onAdd} />

      <SectionHeader title={t('dashboard.budget')} />
      <BudgetOverview
        budgets={budgets}
        today={today}
        onSetBudget={onSetBudget}
        onOpenBudgets={onOpenBudgets}
      />

      <SectionHeader title={t('dashboard.spendingByCategory')} />
      <CategoryBreakdown categories={summary.topCategories} />

      <SectionHeader title={t('dashboard.recentTransactions')} />
      <RecentTransactions
        transactions={summary.recent}
        today={today}
        onPressTransaction={onPressTransaction}
      />
    </View>
  );
}
