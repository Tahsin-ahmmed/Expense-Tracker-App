import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { clearDataOnAccountChange } from '@/features/auth/clearDataOnAccountChange';
import { useAuthStore } from '@/features/auth/instance';
import { t } from '@/i18n';
import { colors } from '@/theme';

// Keep the splash screen up until we know whether someone is signed in.
void SplashScreen.preventAutoHideAsync();

/** Navigation colours derived from the app's tokens (light theme only for now). */
const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

/**
 * Root navigator. Signed-in users only reach the app screens; signed-out
 * users only reach the sign-in screens (Expo Router protected routes).
 */
export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = clearDataOnAccountChange();
    void initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (status !== 'initializing') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'initializing') {
    return null;
  }

  const signedIn = status === 'signedIn';

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-transaction" options={modal(t('addTransaction.title'))} />
          <Stack.Screen name="edit-transaction/[id]" options={modal(t('editTransaction.title'))} />
          <Stack.Screen name="edit-budget/[scope]" options={modal(t('budgets.edit'))} />
        </Stack.Protected>

        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* Reachable signed in (change PIN) and from an email reset link. */}
        <Stack.Screen name="reset-pin" options={modal(t('auth.reset.title'))} />
      </Stack>
    </ThemeProvider>
  );
}
