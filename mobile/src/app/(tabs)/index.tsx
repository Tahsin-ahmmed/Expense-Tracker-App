import { useMemo } from 'react';

import { BrandMark, ErrorState, LoadingState, Screen } from '@/components/ui';
import { currentBalance, monthStart } from '@/domain/balance';
import { OVERALL_SCOPE } from '@/domain/budget';
import { monthOf } from '@/domain/date';
import { openBudgetsTab, openEditBudget } from '@/features/budgets/navigation';
import { useMonthBudgets } from '@/features/budgets/useMonthBudgets';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { buildDashboardSummary } from '@/features/dashboard/summary';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { openAddTransaction, openEditTransaction } from '@/features/transactions/navigation';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { formatMonthLabel, greetingFor } from '@/i18n/format';

export default function DashboardScreen() {
  const { today, hour } = useToday();
  const month = monthOf(today);
  const transactions = useTransactionsStore((state) => state.transactions);
  const profile = useProfileStore((state) => state.profile);
  // Loads transactions, budgets and profile, and reports their combined status.
  const { budgets, status, retry } = useMonthBudgets(month);

  const summary = useMemo(() => buildDashboardSummary(transactions, today), [transactions, today]);
  const balance = useMemo(
    () => currentBalance(transactions, profile, today),
    [transactions, profile, today],
  );
  const start = useMemo(
    () => monthStart(transactions, profile, month),
    [transactions, profile, month],
  );

  // First name only: "Good evening, Tahsin".
  const firstName = profile.displayName?.trim().split(/s+/)[0];
  const greeting = firstName ? `${greetingFor(hour)}, ${firstName}` : greetingFor(hour);

  return (
    <Screen title={formatMonthLabel(month)} eyebrow={greeting} leading={<BrandMark size={44} />}>
      {status === 'error' ? (
        <ErrorState message={t('dashboard.loadError')} onRetry={retry} />
      ) : status !== 'ready' ? (
        <LoadingState />
      ) : (
        <DashboardView
          summary={summary}
          budgets={budgets}
          currentBalance={balance}
          monthStart={start}
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
