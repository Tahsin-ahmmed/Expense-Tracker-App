import { EmptyState, Screen } from '@/components/ui';
import { t } from '@/i18n';

export default function BudgetsScreen() {
  return (
    <Screen title={t('tabs.budgets')}>
      <EmptyState title={t('budgets.empty.title')} message={t('budgets.empty.message')} />
    </Screen>
  );
}
