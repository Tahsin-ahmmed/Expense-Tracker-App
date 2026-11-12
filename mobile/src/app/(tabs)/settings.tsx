import { router } from 'expo-router';

import { Screen } from '@/components/ui';
import { authService, useAuthStore } from '@/features/auth/instance';
import { SettingsView } from '@/features/settings/components/SettingsView';
import { t } from '@/i18n';

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <Screen title={t('tabs.settings')}>
      {user ? (
        <SettingsView
          user={user}
          onChangePin={() => router.push('/reset-pin')}
          onLogOut={() => authService.signOut()}
        />
      ) : null}
    </Screen>
  );
}
