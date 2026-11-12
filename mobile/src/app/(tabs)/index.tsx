import { useMemo } from 'react';

import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { OVERALL_SCOPE } from '@/domain/budget';
import { monthOf } from '@/domain/date';
import { openBudgetsTab, openEditBudget } from '@/features/budgets/navigation';
import { useMonthBudgets } from '@/features/budgets/useMonthBudgets';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { buildDashboardSummary } from '@/features/dashboard/summary';
import { openAddTransaction, openEditTransaction } from '@/features/transactions/navigation';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { formatMonthLabel, greetingFor } from '@/i18n/format';

export default function DashboardScreen() {
  const { today, hour } = useToday();
  const month = monthOf(today);
  const transactions = useTransactionsStore((state) => state.transactions);
  // Loads both transactions and budgets, and reports their combined status.
  const { budgets, status, retry } = useMonthBudgets(month);

  const summary = useMemo(() => buildDashboardSummary(transactions, today), [transactions, today]);

  return (
    <Screen title={formatMonthLabel(month)} eyebrow={greetingFor(hour)}>
      {status === 'error' ? (
        <ErrorState message={t('dashboard.loadError')} onRetry={retry} />
      ) : status !== 'ready' ? (
        <LoadingState />
      ) : (
        <DashboardView
          summary={summary}
          budgets={budgets}
          today={today}
          onAdd={openAddTransaction}
          onPressTransaction={openEditTransaction}
          onSetBudget={() => openEditBudget(OVERALL_SCOPE)}
          onOpenBudgets={openBudgetsTab}
        />
      )}
    </Screen>
  );
}
