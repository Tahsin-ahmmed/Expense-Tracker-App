import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { monthOf } from '@/domain/date';
import type { TransactionType } from '@/domain/transaction';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { buildDashboardSummary } from '@/features/dashboard/summary';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { formatMonthLabel, greetingFor } from '@/i18n/format';

export default function DashboardScreen() {
  const { today, hour } = useToday();
  const transactions = useTransactionsStore((state) => state.transactions);
  const status = useTransactionsStore((state) => state.status);
  const load = useTransactionsStore((state) => state.load);

  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);

  const summary = useMemo(() => buildDashboardSummary(transactions, today), [transactions, today]);

  const openAdd = (type: TransactionType) => {
    router.push({ pathname: '/add-transaction', params: { type } });
  };

  return (
    <Screen title={formatMonthLabel(monthOf(today))} eyebrow={greetingFor(hour)}>
      {status === 'error' ? (
        <ErrorState message={t('dashboard.loadError')} onRetry={() => void load()} />
      ) : status !== 'ready' ? (
        <LoadingState />
      ) : (
        <DashboardView summary={summary} today={today} onAdd={openAdd} />
      )}
    </Screen>
  );
}
