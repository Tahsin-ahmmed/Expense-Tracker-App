import { EmptyState, Screen } from '@/components/ui';
import { t } from '@/i18n';

export default function TransactionsScreen() {
  return (
    <Screen title={t('tabs.transactions')}>
      <EmptyState title={t('transactions.empty.title')} message={t('transactions.empty.message')} />
    </Screen>
  );
}
