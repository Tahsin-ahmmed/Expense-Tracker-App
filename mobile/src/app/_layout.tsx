import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { clearDataOnAccountChange } from '@/features/auth/clearDataOnAccountChange';
import { useAuthStore } from '@/features/auth/instance';
import { useProfileStore } from '@/features/profile/useProfileStore';
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
const page = (title: string) => ({ headerShown: true, title });

/**
 * Root navigator (Expo Router protected routes):
 * - signed out → sign-in screens only;
 * - otherwise → the app.
 */
export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const profileStatus = useProfileStore((state) => state.status);
  const loadProfile = useProfileStore((state) => state.load);

  const signedIn = status === 'signedIn';
  // Wait for the profile so amounts show in the user's currency from the first frame.
  // If it fails to load, show the app: its screens offer "Try again".
  const waitingForProfile = signedIn && (profileStatus === 'idle' || profileStatus === 'loading');
  const ready = status !== 'initializing' && !waitingForProfile;

  useEffect(() => {
    const unsubscribe = clearDataOnAccountChange();
    void initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (signedIn && profileStatus === 'idle') {
      void loadProfile();
    }
  }, [signedIn, profileStatus, loadProfile]);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-transaction" options={modal(t('addTransaction.title'))} />
          <Stack.Screen name="edit-transaction/[id]" options={modal(t('editTransaction.title'))} />
          <Stack.Screen name="edit-budget/[scope]" options={modal(t('budgets.edit'))} />
          <Stack.Screen name="settings/profile" options={page(t('profile.title'))} />
          <Stack.Screen name="settings/delete-account" options={page(t('deleteAccount.title'))} />
          {/* First-login setup; cannot be dismissed until saved. */}
          <Stack.Screen
            name="welcome"
            options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
          />
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
