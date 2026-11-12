import { useMemo, useState } from 'react';

import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { addMonths, monthOf, type MonthKey } from '@/domain/date';
import { useBudgetsStore } from '@/features/budgets/useBudgetsStore';
import { useMonthBudgets } from '@/features/budgets/useMonthBudgets';
import { ReportView } from '@/features/reports/components/ReportView';
import { buildMonthReport, buildTrend } from '@/features/reports/report';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';

export default function ReportsScreen() {
  const { today } = useToday();
  const currentMonth = monthOf(today);
  const [month, setMonth] = useState<MonthKey>(currentMonth);

  // Loads transactions and budgets if needed and reports their combined status.
  const { status, retry } = useMonthBudgets(month);
  const transactions = useTransactionsStore((state) => state.transactions);
  const entries = useBudgetsStore((state) => state.entries);

  const report = useMemo(
    () => buildMonthReport(transactions, entries, month, today),
    [transactions, entries, month, today],
  );
  // The trend ends at the selected month, so earlier months stay reachable by tapping.
  const trend = useMemo(() => buildTrend(transactions, month), [transactions, month]);

  const changeMonth = (next: MonthKey) => setMonth(next > currentMonth ? currentMonth : next);

  return (
    <Screen title={t('tabs.reports')}>
      {status === 'error' ? (
        <ErrorState message={t('reports.loadError')} onRetry={retry} />
      ) : status !== 'ready' ? (
        <LoadingState />
      ) : (
        <ReportView
          month={month}
          report={report}
          trend={trend}
          canGoNext={month < currentMonth}
          onChangeMonth={changeMonth}
          onPreviousMonth={() => changeMonth(addMonths(month, -1))}
          onNextMonth={() => changeMonth(addMonths(month, 1))}
        />
      )}
    </Screen>
  );
}
