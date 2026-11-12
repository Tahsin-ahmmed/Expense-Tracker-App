import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { monthOf } from '@/domain/date';
import { BudgetsView } from '@/features/budgets/components/BudgetsView';
import { openEditBudget } from '@/features/budgets/navigation';
import { useMonthBudgets } from '@/features/budgets/useMonthBudgets';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { formatMonthLabel } from '@/i18n/format';

export default function BudgetsScreen() {
  const { today } = useToday();
  const month = monthOf(today);
  const { budgets, status, retry } = useMonthBudgets(month);

  return (
    <Screen title={t('tabs.budgets')} eyebrow={formatMonthLabel(month)}>
      {status === 'error' ? (
        <ErrorState message={t('budgets.loadError')} onRetry={retry} />
      ) : status !== 'ready' ? (
        <LoadingState />
      ) : (
        <BudgetsView budgets={budgets} onEdit={openEditBudget} />
      )}
    </Screen>
  );
}
