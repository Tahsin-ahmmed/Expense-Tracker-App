import { EmptyState, Screen } from '@/components/ui';
import { t } from '@/i18n';

export default function SettingsScreen() {
  return (
    <Screen title={t('tabs.settings')}>
      <EmptyState title={t('settings.empty.title')} message={t('settings.empty.message')} />
    </Screen>
  );
}
