import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect, useRef } from 'react';

import { useProfileStore } from '@/features/profile/useProfileStore';

import { t } from '@/i18n';
import { useColors } from '@/theme';

/**
 * Bottom tab navigation using the platform's native tab bar.
 * Icons: SF Symbols on iOS (`sf`), Material Symbols on Android (`md`).
 */
export default function TabsLayout() {
  const colors = useColors();
  const profileReady = useProfileStore((state) => state.status === 'ready');
  // The welcome setup saves the starting balance date; until then it is still pending.
  const needsWelcome = useProfileStore((state) => state.profile.openingBalanceDate === null);
  const welcomeShown = useRef(false);

  // First login: open the welcome setup once, on top of the dashboard.
  useEffect(() => {
    if (profileReady && needsWelcome && !welcomeShown.current) {
      welcomeShown.current = true;
      router.push('/welcome');
    }
  }, [profileReady, needsWelcome]);

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.primarySoft}
      tintColor={colors.primary}
      iconColor={colors.textSecondary}
      labelStyle={{ color: colors.textSecondary, selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.dashboard')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>{t('tabs.transactions')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="receipt_long" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budgets">
        <NativeTabs.Trigger.Label>{t('tabs.budgets')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.pie" md="pie_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Label>{t('tabs.reports')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
