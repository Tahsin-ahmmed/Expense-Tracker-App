import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { t } from '@/i18n';
import { colors } from '@/theme';

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

/**
 * Root navigator. A Stack wraps the tab group so full-screen routes
 * (e.g. "Add transaction") open on top of the tabs.
 */
export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: t('addTransaction.title'),
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
