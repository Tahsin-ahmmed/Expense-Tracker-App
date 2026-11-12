import Constants from 'expo-constants';
import { router } from 'expo-router';

import { ErrorState, LoadingState, Screen } from '@/components/ui';
import type { ThemePreference } from '@/domain/profile';
import { authService, useAuthStore } from '@/features/auth/instance';
import { useProfileStore } from '@/features/profile/useProfileStore';
import { SettingsView } from '@/features/settings/components/SettingsView';
import {
  exportTransactionsCsv,
  SharingUnavailableError,
} from '@/features/settings/exportTransactions';
import { useTransactionsStore } from '@/features/transactions/useTransactionsStore';
import { useAppData } from '@/hooks/useAppData';
import { useToday } from '@/hooks/useToday';
import { t } from '@/i18n';
import { setThemePreference } from '@/theme';

export default function SettingsScreen() {
  const { today } = useToday();
  const { status, retry } = useAppData();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.update);
  const transactions = useTransactionsStore((state) => state.transactions);

  // Apply right away; if saving fails, switch back to the saved theme.
  const handleChangeTheme = async (theme: ThemePreference) => {
    const previous = profile.theme;
    setThemePreference(theme);
    try {
      await updateProfile({ theme });
    } catch (error) {
      setThemePreference(previous);
      throw error;
    }
  };

  const handleExport = async () => {
    if (transactions.length === 0) {
      throw new Error(t('settings.export.empty'));
    }
    try {
      await exportTransactionsCsv(transactions, profile.currency, today);
    } catch (error) {
      throw new Error(
        error instanceof SharingUnavailableError
          ? t('settings.export.unavailable')
          : t('settings.export.error'),
      );
    }
  };

  return (
    <Screen title={t('tabs.settings')}>
      {status === 'error' ? (
        <ErrorState message={t('profile.saveError')} onRetry={retry} />
      ) : status !== 'ready' || !user ? (
        <LoadingState />
      ) : (
        <SettingsView
          user={user}
          profile={profile}
          appVersion={Constants.expoConfig?.version ?? '—'}
          onOpenProfile={() => router.push('/settings/profile')}
          onChangeTheme={handleChangeTheme}
          onChangePin={() => router.push('/reset-pin')}
          onExport={handleExport}
          onDeleteAccount={() => router.push('/settings/delete-account')}
          onLogOut={() => authService.signOut()}
        />
      )}
    </Screen>
  );
}
