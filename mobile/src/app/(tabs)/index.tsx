import { EmptyState, Screen } from '@/components/ui';
import { t } from '@/i18n';

export default function DashboardScreen() {
  return (
    <Screen title={t('tabs.dashboard')}>
      <EmptyState title={t('dashboard.empty.title')} message={t('dashboard.empty.message')} />
    </Screen>
  );
}
